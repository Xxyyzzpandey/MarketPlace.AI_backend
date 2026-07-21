import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

// 2. Mock external dependencies
vi.mock('groq-sdk', () => ({
  default: class {
    chat = {
      completions: {
        create: mockCreate,
      },
    };
  },
}));

vi.mock('../utils/aiHelper.js', () => ({
  generateVector: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

vi.mock('../models/sellerModel.js', () => ({
  default: {
    aggregate: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../models/leadSchema.js', () => ({
  default: {
    create: vi.fn(),
  },
}));

vi.mock('../models/sourcingModel.js', () => ({
  default: {
    create: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

import Wholesaler from '../models/sellerModel.js';
import Lead from '../models/leadSchema.js';
import SourcingRequest from '../models/sourcingModel.js';
import searchProductRouter from '../routes/searchProduct.js';

const app = express();
app.use(express.json());
app.use('/', searchProductRouter);

const mockGroqResponse = (...jsonPayloads) => {
  const queue = [...jsonPayloads];
  mockCreate.mockImplementation(() => {
    const payload = queue.shift() || {};
    return Promise.resolve({
      choices: [{ message: { content: JSON.stringify(payload) } }],
    });
  });
};

describe('POST /searchProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('returns 400 if buyerInfo is missing', async () => {
      const res = await request(app)
        .post('/searchProduct')
        .send({ userPrompt: 'need 100 cotton shirts' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 if buyerInfo.id is missing', async () => {
      const res = await request(app)
        .post('/searchProduct')
        .send({ userPrompt: 'need shirts', buyerInfo: {} });

      expect(res.status).toBe(400);
    });
  });

  describe('Match Operations & Pipeline Execution', () => {
    it('returns success:false when no suppliers match vector/category search', async () => {
      mockGroqResponse({
        category: 'apparel',
        item: 'shirts',
        quantity: 100,
        specifications: 'cotton',
      });

      SourcingRequest.create.mockResolvedValueOnce({ _id: 'req123' });
      Wholesaler.aggregate.mockResolvedValueOnce([]); // No matching sellers found

      const res = await request(app)
        .post('/searchProduct')
        .send({ userPrompt: 'need cotton shirts', buyerInfo: { id: 'buyer1' } });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No match.');
    });

    it('creates leads and triggers notification on successful match', async () => {
      
      mockGroqResponse(
  { category: 'apparel', item: 'shirts', quantity: 100, specifications: 'cotton' },
  { topSuppliers: ['seller1'] } 
);

      SourcingRequest.create.mockResolvedValueOnce({ _id: 'req123' });
      Wholesaler.aggregate.mockResolvedValueOnce([
        { _id: 'seller1', description: 'cotton supplier' },
      ]);
      Wholesaler.findById.mockResolvedValueOnce({
        _id: 'seller1',
        businessName: 'ABC Textiles',
        whatsappNumber: '919999999999',
      });
      Lead.create.mockResolvedValueOnce({ _id: 'lead1' });

      const res = await request(app)
        .post('/searchProduct')
        .send({ userPrompt: 'need 100 cotton shirts', buyerInfo: { id: 'buyer1' } });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Lead.create).toHaveBeenCalledTimes(1);
    });

    it('skips lead creation gracefully if seller lookup returns null', async () => {
      mockGroqResponse(
  { category: 'apparel', item: 'shirts', quantity: 1, specifications: '' },
  { topSuppliers: ['ghostSeller'] }  
);

      SourcingRequest.create.mockResolvedValueOnce({ _id: 'req123' });
      Wholesaler.aggregate.mockResolvedValueOnce([
        { _id: 'ghostSeller', description: 'x' },
      ]);
      Wholesaler.findById.mockResolvedValueOnce(null); 

      const res = await request(app)
        .post('/searchProduct')
        .send({ userPrompt: 'need shirts', buyerInfo: { id: 'buyer1' } });

      expect(res.status).toBe(200);
      expect(Lead.create).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('returns 500 when Groq API fails', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Groq API error'));

      const res = await request(app)
        .post('/searchProduct')
        .send({ userPrompt: 'need shirts', buyerInfo: { id: 'buyer1' } });

      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
    });
  });
});