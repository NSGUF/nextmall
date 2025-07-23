import {
    defaultShouldDehydrateQuery,
    QueryClient,
    QueryCache,
    MutationCache,
} from '@tanstack/react-query';
import SuperJSON from 'superjson';
import { handleGlobalError } from '@/app/utils';

export const createQueryClient = () =>
    new QueryClient({
        queryCache: new QueryCache({
            onError: handleGlobalError,
        }),
        mutationCache: new MutationCache({
            onError: handleGlobalError,
        }),
        defaultOptions: {
            queries: {
                // With SSR, we usually want to set some default staleTime
                // above 0 to avoid refetching immediately on the client
                staleTime: 30 * 1000,
            },
            dehydrate: {
                serializeData: SuperJSON.serialize,
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) ||
                    query.state.status === 'pending',
            },
            hydrate: {
                deserializeData: SuperJSON.deserialize,
            },
        },
    });
