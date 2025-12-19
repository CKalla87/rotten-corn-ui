// Mock for giphy service in tests
export const giphyService = {
  search: jest.fn().mockResolvedValue({
    data: {
      data: []
    }
  }),
  trending: jest.fn().mockResolvedValue({
    data: {
      data: []
    }
  })
};

