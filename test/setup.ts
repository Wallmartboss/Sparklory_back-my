// Mock mongoose
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    Types: {
      ...originalModule.Types,
      ObjectId: jest.fn().mockImplementation(() => 'mock-object-id'),
    },
  };
});

// Mock JwtAuthGuard
jest.mock('@/auth/guards/jwt.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));
