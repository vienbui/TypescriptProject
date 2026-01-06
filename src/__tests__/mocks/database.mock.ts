// Mock database module
// Using global Jest (auto-available in Jest environment) for better type inference

// Mock repository methods
export const mockRepository = {
  createQueryBuilder: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getCount: jest.fn(),
  getRawOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  execute: jest.fn(),
};

// Mock transaction manager
export const mockTransactionManager = {
  getRepository: jest.fn().mockReturnValue(mockRepository),
  createQueryBuilder: jest.fn().mockReturnValue(mockRepository),
};

// Mock AppDataSource
export const mockAppDataSource = {
  getRepository: jest.fn().mockReturnValue(mockRepository),
  createQueryBuilder: jest.fn().mockReturnValue(mockRepository),
  manager: {
    save: jest.fn(),
    transaction: jest.fn().mockImplementation(async (isolationLevel, callback) => {
      if (typeof isolationLevel === 'function') {
        return await isolationLevel(mockTransactionManager);
      }
      return await callback(mockTransactionManager);
    }),
  },
  initialize: jest.fn().mockResolvedValue(undefined),
  isInitialized: true,
};

// Function to reset all mocks
export const resetMocks = () => {
  Object.values(mockRepository).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      (mock as jest.Mock<any, any>).mockReset();
    }
  });
  mockAppDataSource.getRepository.mockReturnValue(mockRepository);
  mockAppDataSource.createQueryBuilder.mockReturnValue(mockRepository);
  mockTransactionManager.getRepository.mockReturnValue(mockRepository);
  mockTransactionManager.createQueryBuilder.mockReturnValue(mockRepository);
  
  // Re-setup chainable methods
  mockRepository.createQueryBuilder.mockReturnThis();
  mockRepository.where.mockReturnThis();
  mockRepository.andWhere.mockReturnThis();
  mockRepository.orderBy.mockReturnThis();
  mockRepository.skip.mockReturnThis();
  mockRepository.take.mockReturnThis();
  mockRepository.select.mockReturnThis();
  mockRepository.update.mockReturnThis();
  mockRepository.set.mockReturnThis();
  mockRepository.delete.mockReturnThis();
};

