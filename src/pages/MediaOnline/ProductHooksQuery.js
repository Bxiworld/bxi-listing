import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { toast } from 'sonner';

export const usePostProductQuery = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/product/product_mutation', data);
      return response;
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create product');
    },
  });
};

export const useUpdateProductQuery = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/product/product_mutation', data);
      return response;
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update product');
    },
  });
};

export const useMediaOnlineFeaturesQuery = () => {
  return useQuery({
    queryKey: ['mediaOnlineFeatures'],
    queryFn: async () => {
      const response = await api.get('/mediaonlinesinfeature/Get_media_onlinesinglefea');
      return response?.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
