import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookRepository, Book } from '../../../services/database';

/**
 * Hook to fetch all books
 */
export const useBooks = () => {
    return useQuery({
        queryKey: ['books'],
        queryFn: () => BookRepository.getAll(),
    });
};

/**
 * Hook to create a new book
 */
export const useCreateBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) =>
            BookRepository.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};

/**
 * Hook to update a book
 */
export const useUpdateBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Book> }) =>
            BookRepository.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};

/**
 * Hook to delete a book
 */
export const useDeleteBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => BookRepository.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};
