"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as api from "@/lib/fake-api/api";
import type {
  ForgeProvider,
  ForgeRepository,
  InventoryAsset,
  InventorySearch,
  ListingSearch,
  NewUpload,
} from "@/lib/fake-api/types";

/** How often an asset still being analyzed is fetched again. */
const ASSET_ANALYSIS_POLL_MS = 5_000;

const BROWSE_PAGE_SIZE = 8;

const queryKeys = {
  listings: (search: ListingSearch) => ["listings", search] as const,
  listing: (id: string) => ["listing", id] as const,
  inventory: (search: InventorySearch) => ["inventory", search] as const,
  inventoryAll: ["inventory"] as const,
  asset: (id: string) => ["asset", id] as const,
  assetAll: ["asset"] as const,
  codebaseActivity: (source: CodebaseActivitySource) => ["codebase-activity", source] as const,
  forgeConnections: ["forge-connections"] as const,
  forgeRepositories: (provider: ForgeProvider) => ["forge-repositories", provider] as const,
};

export type CodebaseActivitySource = Parameters<typeof api.getCodebaseActivity>[0];

function analyzing(asset: InventoryAsset): boolean {
  return asset.analysisStatus === "pending" || asset.analysisStatus === "running";
}

export function useListingsBrowseQuery(search: ListingSearch) {
  return useInfiniteQuery({
    queryKey: queryKeys.listings(search),
    queryFn: ({ pageParam }) => api.listListings(search, pageParam, BROWSE_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (page) => page.nextOffset,
    placeholderData: keepPreviousData,
  });
}

export function useListingQuery(id: string) {
  return useQuery({ queryKey: queryKeys.listing(id), queryFn: () => api.getListing(id) });
}

export function useInventoryQuery(search: InventorySearch) {
  return useQuery({
    queryKey: queryKeys.inventory(search),
    queryFn: () => api.listInventory(search),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.assets.some(analyzing) ? ASSET_ANALYSIS_POLL_MS : false,
  });
}

export function useAssetQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.asset(id),
    queryFn: () => api.getAsset(id),
    refetchInterval: (query) =>
      query.state.data && analyzing(query.state.data) ? ASSET_ANALYSIS_POLL_MS : false,
  });
}

export function useCodebaseActivityQuery(source: CodebaseActivitySource, enabled = true) {
  return useQuery({
    queryKey: queryKeys.codebaseActivity(source),
    queryFn: () => api.getCodebaseActivity(source),
    enabled,
    staleTime: Infinity,
  });
}

export function useForgeConnectionsQuery() {
  return useQuery({ queryKey: queryKeys.forgeConnections, queryFn: api.listForgeConnections });
}

export function useForgeRepositoriesQuery(provider: ForgeProvider, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.forgeRepositories(provider),
    queryFn: () => api.listForgeRepositories(provider),
    enabled,
  });
}

function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.assetAll }),
    ]);
}

export function useCreateUploadMutation() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (upload: NewUpload) => api.createUpload(upload),
    onSuccess: invalidate,
  });
}

export function useImportRepositoriesMutation() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (repositories: readonly ForgeRepository[]) => api.importRepositories(repositories),
    onSuccess: invalidate,
  });
}

export function useConnectForgeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: ForgeProvider) => api.connectForge(provider),
    onSuccess: (connected) => queryClient.setQueryData(queryKeys.forgeConnections, connected),
  });
}

export function useDeleteAssetsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: readonly string[]) => api.deleteAssets(ids),
    onSuccess: (_, ids) => {
      for (const id of ids) queryClient.removeQueries({ queryKey: queryKeys.asset(id) });
      return queryClient.invalidateQueries({ queryKey: queryKeys.inventoryAll });
    },
  });
}

export function useCreateGroupMutation() {
  const invalidate = useInvalidateInventory();
  return useMutation({ mutationFn: (name: string) => api.createGroup(name), onSuccess: invalidate });
}

export function useDeleteGroupMutation() {
  const invalidate = useInvalidateInventory();
  return useMutation({ mutationFn: (id: string) => api.deleteGroup(id), onSuccess: invalidate });
}

export function useMoveAssetsMutation() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: ({ ids, groupId }: { ids: readonly string[]; groupId: string | null }) =>
      api.moveAssets(ids, groupId),
    onSuccess: invalidate,
  });
}

export function useResetDemoDataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.resetDemoData,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
