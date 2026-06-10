import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
let getAuthToken = () => localStorage.getItem("accessToken");

type UploadProgress = {
  loaded: number;
  total: number;
};

type ApiOptions = RequestInit & {
  onUploadProgress?: (progress: UploadProgress) => void;
};

export const getImageUrl = (filePath) => {
  console.log("getImageUrl called with filePath:", filePath, "baseUrl:", baseUrl);
  if (!filePath) return "";
  if (filePath.startsWith("http")) return filePath;
  const fullUrl = `${baseUrl}${filePath}`;
  console.log("getImageUrl returning:", fullUrl);
  return fullUrl;
};

export const setBaseUrl = (url) => {
  baseUrl = url;
};

export const setAuthTokenGetter = (getter) => {
  getAuthToken = getter;
};

const api = async (
  endpoint,
  options: ApiOptions = {}
) => {
  console.log("Calling api endpoint: ", endpoint, "with options: ", options);
  const headers: Record<string, string> = {
    ...options.headers,
  } as Record<string, string>;

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set Content-Type to application/json if we're not sending FormData
  if (
  options.body &&
  !(options.body instanceof FormData)
) {
  headers["Content-Type"] = "application/json";
}
  const requestBody = options.body;
  
  // If we have FormData and onUploadProgress, use XMLHttpRequest for progress tracking
  if (options.body instanceof FormData && options.onUploadProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(options.method || "POST", `${baseUrl}/api${endpoint}`);
      
      // Set headers (except Content-Type for FormData)
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          options.onUploadProgress?.({
            loaded: event.loaded,
            total: event.total,
          });
        }
      });

      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data.error || "API request failed"));
          }
        } catch (e) {
          reject(new Error("Failed to parse response"));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.addEventListener("abort", () => reject(new Error("Request aborted")));

      xhr.send(requestBody as XMLHttpRequestBodyInit);
    });
  }

  // For FormData requests, remove Content-Type header to let browser set it with boundary
  const fetchHeaders = { ...headers };
  if (options.body instanceof FormData) {
    delete fetchHeaders["Content-Type"];
  }

  console.log("Calling fetch to: ", `${baseUrl}/api${endpoint}`, "with headers: ", fetchHeaders);
  const res = await fetch(`${baseUrl}/api${endpoint}`, {
    ...options,
    headers: fetchHeaders,
  });
  console.log("Got response from fetch: ", res);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Error in fetch response: ", res, errorData);
    throw new Error(errorData.error || "API request failed");
  }

  return res.json();
};

// Auth
export const login = async (email, password) => {
  return api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const logout = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  return api("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
};

export const deleteAccount = async () => {
  return api("/auth/account", {
    method: "DELETE",
  });
};

export const getMe = async () => {
  try {
    const response = await api("/auth/me", {
      method: "GET",
    });
    return response.user;
  } catch (error) {
    // If it's a 401 Unauthorized, return null
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return null;
    }
    throw error;
  }
};

// Users
export const getUsersList = async (options) => {
  const params = new URLSearchParams();
  if (options?.search) params.set("search", options.search);
  if (options?.plan) params.set("plan", options.plan);
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  return api(`/users?${params.toString()}`);
};

export const getUserById = async (id) => {
  return api(`/users/${id}`);
};

export const updateUser = async (id, data) => {
  return api(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const banUser = async (id, reason) => {
  return api(`/users/${id}/ban`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
};

export const unbanUser = async (id) => {
  return api(`/users/${id}/unban`, { method: "POST" });
};

export const deleteUser = async (id) => {
  return api(`/users/${id}`, { method: "DELETE" });
};

// Hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ email, password }) =>
      login(email, password),
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      queryClient.invalidateQueries();
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: () => logout(),
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.clear();
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: () => deleteAccount(),
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.clear();
    },
  });
};

export const useGetMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: 1,
  });
};

export const useGetUsersList = (options) => {
  return useQuery({
    queryKey: ["users-list", options],
    queryFn: () => getUsersList(options),
  });
};

export const useGetUserById = (id) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const result = await getUserById(id);
      return result.data;
    },
    enabled: !!id,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, reason }) =>
      banUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: unbanUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
    },
  });
};

// Languages
export const getLanguagesList = async () => {
  return api("/languages");
};

export const getLanguageById = async (id) => {
  return api(`/languages/${id}`);
};

export const createLanguage = async (formData, options) => {
  return api("/languages", {
    method: "POST",
    body: formData,
    ...options,
  });
};

export const updateLanguage = async (id, formData, options) => {
  return api(`/languages/${id}`, {
    method: "PUT",
    body: formData,
    ...options,
  });
};

export const deleteLanguage = async (id) => {
  return api(`/languages/${id}`, { method: "DELETE" });
};

// Hooks
export const useGetLanguagesList = () => {
  return useQuery({
    queryKey: ["languages-list"],
    queryFn: () => getLanguagesList(),
  });
};

export const useGetLanguageById = (id) => {
  return useQuery({
    queryKey: ["language", id],
    queryFn: () => getLanguageById(id),
    enabled: !!id,
  });
};

export const useCreateLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ data, onUploadProgress }) => 
      createLanguage(data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages-list"] });
    },
  });
};

export const useUpdateLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data, onUploadProgress }) => 
      updateLanguage(id, data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages-list"] });
    },
  });
};

export const useDeleteLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteLanguage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages-list"] });
    },
  });
};

// Promotions
export const getPromotionsList = async (options) => {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());
  return api(`/promotions?${params.toString()}`);
};

export const getActivePromotion = async () => {
  return api("/promotions/active");
};

export const getPromotionById = async (id) => {
  return api(`/promotions/${id}`);
};

export const createPromotion = async (data, options) => {
  return api("/promotions", {
    method: "POST",
    body: data,
    ...options,
  });
};

export const updatePromotion = async (id, data, options) => {
  return api(`/promotions/${id}`, {
    method: "PUT",
    body: data,
    ...options,
  });
};

export const deletePromotion = async (id) => {
  return api(`/promotions/${id}`, { method: "DELETE" });
};

export const bulkDeletePromotions = async (ids) => {
  return api('/promotions/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
};

// Hooks
export const useGetPromotionsList = (options) => {
  return useQuery({
    queryKey: ["promotions-list", options],
    queryFn: () => getPromotionsList(options),
  });
};

export const useGetActivePromotion = () => {
  return useQuery({
    queryKey: ["promotion-active"],
    queryFn: getActivePromotion,
  });
};

export const useGetPromotionById = (id) => {
  return useQuery({
    queryKey: ["promotion", id],
    queryFn: async () => {
      const result = await getPromotionById(id);
      return result.data;
    },
    enabled: !!id,
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ data, onUploadProgress }) => 
      createPromotion(data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-list"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-active"] });
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data, onUploadProgress }) => 
      updatePromotion(id, data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-list"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-active"] });
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deletePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-list"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-active"] });
    },
  });
};

export const useBulkDeletePromotions = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: bulkDeletePromotions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-list"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-active"] });
    },
  });
};

// Banner Shows
export const getBannersList = async (options) => {
  const params = new URLSearchParams();
  if (options?.admin) params.set("admin", "true");
  if (options?.platform) params.set("platform", options.platform);
  return api(`/banners?${params.toString()}`);
};

export const getBannerById = async (bannerId) => {
  return api(`/banners/item/${bannerId}`);
};

export const getBannerShowByContentId = async (
  contentId,
  options
) => {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());
  return api(`/banners/${contentId}?${params.toString()}`);
};

export const createBannerShow = async (
  data,
  options
) => {
  return api("/banners", {
    method: "POST",
    body: data,
    ...options,
  });
};

export const updateBanner = async (
  bannerId,
  data,
  options
) => {
  return api(`/banners/item/${bannerId}`, {
    method: "PUT",
    body: data,
    ...options,
  });
};

export const deleteBanner = async (bannerId) => {
  return api(`/banners/item/${bannerId}`, { method: "DELETE" });
};

export const bulkDeleteBanners = async (ids) => {
  return api("/banners/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
    headers: { "Content-Type": "application/json" },
  });
};

export const appendBannerShowVideo = async (
  contentId,
  data,
  options
) => {
  return api(`/banners/${contentId}/videos`, {
    method: "POST",
    body: data,
    ...options,
  });
};

export const updateEpisodeLock = async (episodeId, isLocked) => {
  return api(`/episodes/${episodeId}/lock`, {
    method: "PATCH",
    body: JSON.stringify({ isLocked }),
  });
};

export const useGetBannersList = (options) => {
  return useQuery({
    queryKey: ["banners-list", options],
    queryFn: () => getBannersList(options),
  });
};

export const useGetBannerById = (bannerId) => {
  return useQuery({
    queryKey: ["banner", bannerId],
    queryFn: async () => {
      const result = await getBannerById(bannerId);
      return result.data;
    },
    enabled: !!bannerId,
  });
};

export const useGetBannerShowByContentId = (
  contentId,
  options = {}
) => {
  return useQuery({
    queryKey: ["banner-show", contentId, options],
    queryFn: async () => {
      const result = await getBannerShowByContentId(contentId, options);
      return result.data;
    },
    enabled: !!contentId,
  });
};

export const useCreateBannerShow = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({
      data,
      onUploadProgress,
    }) => createBannerShow(data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({
      bannerId,
      data,
      onUploadProgress,
    }) => updateBanner(bannerId, data, { onUploadProgress }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
      queryClient.invalidateQueries({ queryKey: ["banner", variables.bannerId] });
      queryClient.invalidateQueries({ queryKey: ["banner-show"] });
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
      queryClient.invalidateQueries({ queryKey: ["banner-show"] });
    },
  });
};

export const useBulkDeleteBanners = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: bulkDeleteBanners,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
      queryClient.invalidateQueries({ queryKey: ["banner-show"] });
    },
  });
};

export const useAppendBannerShowVideo = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({
      contentId,
      data,
      onUploadProgress,
    }) => appendBannerShowVideo(contentId, data, { onUploadProgress }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
      queryClient.invalidateQueries({ queryKey: ["banner-show", variables.contentId] });
    },
  });
};

export const useUpdateEpisodeLock = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ episodeId, isLocked }) =>
      updateEpisodeLock(episodeId, isLocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-show"] });
    },
  });
};

// Categories
export const getCategoriesList = async (options) => {
  const params = new URLSearchParams();
  if (options?.admin) params.set("admin", "true");
  if (options?.page) params.set("page", options.page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());
  return api(`/categories?${params.toString()}`);
};

export const getCategoriesWithContent = async () => {
  return api("/categories/with-content");
};

export const getCategoryById = async (categoryId) => {
  return api(`/categories/item/${categoryId}`);
};

export const getCategoryContents = async (categoryId, options) => {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());
  return api(`/categories/${categoryId}/contents?${params.toString()}`);
};

export const createCategory = async (data, options = {}) => {
  return api("/categories", {
    method: "POST",
    body: data,
    ...options,
  });
};

export const updateCategory = async (categoryId, data, options = {}) => {
  return api(`/categories/item/${categoryId}`, {
    method: "PUT",
    body: data,
    ...options,
  });
};

export const deleteCategory = async (categoryId) => {
  return api(`/categories/item/${categoryId}`, { method: "DELETE" });
};

export const bulkDeleteCategories = async (ids) => {
  return api("/categories/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
    headers: { "Content-Type": "application/json" },
  });
};

export const addContentToCategory = async (categoryId, contentId) => {
  return api(`/categories/${categoryId}/contents/${contentId}`, { method: "POST" });
};

export const removeContentFromCategory = async (categoryId, contentId) => {
  return api(`/categories/${categoryId}/contents/${contentId}`, { method: "DELETE" });
};

// Hooks
export const useGetCategoriesList = (options = {}) => {
  return useQuery({
    queryKey: ["categories-list", options],
    queryFn: () => getCategoriesList(options),
  });
};

export const useGetCategoriesWithContent = () => {
  return useQuery({
    queryKey: ["categories-with-content"],
    queryFn: getCategoriesWithContent,
  });
};

export const useGetCategoryById = (categoryId) => {
  return useQuery({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      const result = await getCategoryById(categoryId);
      return result.data;
    },
    enabled: !!categoryId,
  });
};

export const useGetCategoryContents = (categoryId, options = {}) => {
  return useQuery({
    queryKey: ["category-contents", categoryId, options],
    queryFn: () => getCategoryContents(categoryId, options),
    enabled: !!categoryId,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ data }) =>
      createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ categoryId, data }) =>
      updateCategory(categoryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["category", variables.categoryId] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    },
  });
};

export const useBulkDeleteCategories = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: bulkDeleteCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    },
  });
};

export const useAddContentToCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ categoryId, contentId }) =>
      addContentToCategory(categoryId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

export const useRemoveContentFromCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ categoryId, contentId }) =>
      removeContentFromCategory(categoryId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

// Notification Templates
export const getNotificationTemplates = async () => {
  return api("/notification-templates");
};

export const getNotificationTemplateById = async (templateId: string) => {
  return api(`/notification-templates/item/${templateId}`);
};

export const createNotificationTemplate = async (data: any, options?: ApiOptions) => {
  return api("/notification-templates", {
    method: "POST",
    body: JSON.stringify(data),
    ...options,
  });
};

export const updateNotificationTemplate = async (templateId: string, data: any, options?: ApiOptions) => {
  return api(`/notification-templates/item/${templateId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    ...options,
  });
};

export const toggleNotificationTemplateStatus = async (templateId: string) => {
  return api(`/notification-templates/item/${templateId}/toggle-status`, {
    method: "PATCH",
  });
};

export const deleteNotificationTemplate = async (templateId: string) => {
  return api(`/notification-templates/item/${templateId}`, {
    method: "DELETE",
  });
};

export const useGetNotificationTemplates = () => {
  return useQuery({
    queryKey: ["notification-templates"],
    queryFn: getNotificationTemplates,
  });
};

export const useGetNotificationTemplateById = (templateId?: string) => {
  return useQuery({
    queryKey: ["notification-template", templateId],
    queryFn: () => getNotificationTemplateById(templateId!),
    enabled: !!templateId,
  });
};

export const useCreateNotificationTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { data: any }>({
    mutationFn: ({ data }) => createNotificationTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
    },
  });
};

export const useUpdateNotificationTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { templateId: string; data: any }>({
    mutationFn: ({ templateId, data }) => updateNotificationTemplate(templateId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      queryClient.invalidateQueries({ queryKey: ["notification-template", variables.templateId] });
    },
  });
};

export const useToggleNotificationTemplateStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (templateId) => toggleNotificationTemplateStatus(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
    },
  });
};

export const useDeleteNotificationTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (templateId) => deleteNotificationTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
    },
  });
};

// Category Shows
export const createCategoryShow = async (data, options) => {
  return api("/categories/show", {
    method: "POST",
    body: data,
    ...options,
  });
};

export const appendCategoryShowVideo = async (
  contentId,
  data,
  options
) => {
  return api(`/categories/${contentId}/videos`, {
    method: "POST",
    body: data,
    ...options,
  });
};

export const getCategoryShowByContentId = async (
  contentId,
  options
) => {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());
  return api(`/categories/${contentId}?${params.toString()}`);
};

export const updateCategoryEpisodeLock = async (episodeId, isLocked) => {
  return api(`/categories/episodes/${episodeId}/lock`, {
    method: "PUT",
    body: JSON.stringify({ isLocked }),
  });
};

// Hooks
export const useCreateCategoryShow = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ data, onUploadProgress }) =>
      createCategoryShow(data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

export const useAppendCategoryShowVideo = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({
      contentId,
      data,
      onUploadProgress,
    }) => appendCategoryShowVideo(contentId, data, { onUploadProgress }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
      queryClient.invalidateQueries({
        queryKey: ["category-show", variables.contentId],
      });
    },
  });
};

export const useGetCategoryShowByContentId = (
  contentId,
  options = {}
) => {
  return useQuery({
    queryKey: ["category-show", contentId, options],
    queryFn: async () => {
      const result = await getCategoryShowByContentId(contentId, options);
      return result.data;
    },
    enabled: !!contentId,
  });
};

export const useUpdateCategoryEpisodeLock = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ episodeId, isLocked }) =>
      updateCategoryEpisodeLock(episodeId, isLocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-show"] });
      queryClient.invalidateQueries({ queryKey: ["banner-show"] });
    },
  });
};

// Content / Shows
export const getContentList = async (options) => {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.search) params.set("search", options.search);
  if (options?.type) params.set("type", options.type);
  if (options?.status) params.set("status", options.status);
  return api(`/contents?${params.toString()}`);
};

export const createContent = async (data, options) => {
  return api("/contents", {
    method: "POST",
    body: data,
    ...options,
  });
};

export const getContentById = async (id) => {
  return api(`/contents/${id}`);
};

export const appendContentVideo = async (contentId, data, options) => {
  return api(`/contents/${contentId}/videos`, {
    method: "POST",
    body: data,
    ...options,
  });
};

export const updateContentEpisodeLock = async (episodeId, isLocked) => {
  return api(`/contents/episodes/${episodeId}/lock`, {
    method: "PUT",
    body: JSON.stringify({ isLocked }),
  });
};

export const updateContent = async (id, data) => {
  return api(`/contents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
};

export const deleteContent = async (id) => {
  return api(`/contents/${id}`, { method: "DELETE" });
};

// Hooks
export const useGetContentList = (options) => {
  return useQuery({
    queryKey: ["content-list", options],
    queryFn: () => getContentList(options),
  });
};

export const useGetContentById = (id) => {
  return useQuery({
    queryKey: ["content", id],
    queryFn: async () => {
      const result = await getContentById(id);
      return result.data;
    },
    enabled: !!id,
  });
};

export const useCreateContent = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ data, onUploadProgress }) =>
      createContent(data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

export const useAppendContentVideo = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({
      contentId,
      data,
      onUploadProgress,
    }) => appendContentVideo(contentId, data, { onUploadProgress }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
      queryClient.invalidateQueries({ queryKey: ["content", variables.contentId] });
    },
  });
};

export const useUpdateContentEpisodeLock = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ episodeId, isLocked }) =>
      updateContentEpisodeLock(episodeId, isLocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
    },
  });
};

export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }) => updateContent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
      queryClient.invalidateQueries({ queryKey: ["content", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

export const useDeleteContent = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

// Pages API
export const getPages = async (options?: { page?: number; limit?: number; admin?: boolean }) => {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', options.page.toString());
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.admin) params.set('admin', 'true');
  return api(`/pages?${params.toString()}`);
};

export const getPageBySlug = async (slug: string) => {
  return api(`/pages/${slug}`);
};

export const getPageById = async (id: string) => {
  return api(`/pages/item/${id}`);
};

export const createPage = async (data: any) => {
  return api('/pages', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
};

export const updatePage = async (id: string, data: any) => {
  return api(`/pages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
};

export const deletePage = async (id: string) => {
  return api(`/pages/${id}`, { method: 'DELETE' });
};

export const bulkDeletePages = async (ids: string[]) => {
  return api('/pages/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
    headers: { 'Content-Type': 'application/json' }
  });
};

export const useGetPages = (options?: { page?: number; limit?: number; admin?: boolean }) => {
  return useQuery({
    queryKey: ['pages', options],
    queryFn: () => getPages(options)
  });
};

export const useGetPageBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['page', slug],
    queryFn: () => getPageBySlug(slug)
  });
};

export const useCreatePage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    }
  });
};

export const useUpdatePage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }: any) => updatePage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    }
  });
};

export const useDeletePage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    }
  });
};

export const useBulkDeletePages = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: bulkDeletePages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    }
  });
};

// Ads API
export const getAds = async (options?: any) => {
  const params = new URLSearchParams();
  if (options?.type) params.set('type', options.type);
  if (options?.platform) params.set('platform', options.platform);
  return api(`/ads?${params.toString()}`);
};

export const createAd = async (data: any) => {
  return api('/ads', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
};

export const updateAd = async (id: string, data: any) => {
  return api(`/ads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
};

export const deleteAd = async (id: string) => {
  return api(`/ads/${id}`, { method: 'DELETE' });
};

export const useGetAds = (options?: any) => {
  return useQuery({
    queryKey: ['ads', options],
    queryFn: () => getAds(options)
  });
};

export const useCreateAd = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    }
  });
};

export const useUpdateAd = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }: any) => updateAd(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    }
  });
};

export const useDeleteAd = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    }
  });
};

// Settings
export const getSettings = async () => {
  const response = await api("/settings");
  return response.data;
};

export const updateSettingsData = async (data: Record<string, any>) => {
  const response = await api("/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.data;
};

export const uploadSettingsLogos = async (formData: FormData) => {
  const response = await api("/settings/upload-logos", {
    method: "POST",
    body: formData,
  });
  return response.data;
};

export const useGetSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, Record<string, any>>({
    mutationFn: (data) => updateSettingsData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
};

export const useUploadSettingsLogos = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, FormData>({
    mutationFn: (formData) => uploadSettingsLogos(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
};

// Genres
export const getGenres = async (options?: { page?: number; limit?: number; admin?: boolean }) => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.admin) params.append('admin', 'true');
  return api(`/genres?${params.toString()}`);
};

export const getGenreById = async (id: string) => {
  return api(`/genres/item/${id}`);
};

export const createGenre = async (formData: FormData) => {
  return api('/genres', {
    method: 'POST',
    body: formData,
  });
};

export const updateGenre = async (id: string, formData: FormData) => {
  return api(`/genres/item/${id}`, {
    method: 'PUT',
    body: formData,
  });
};

export const deleteGenre = async (id: string) => {
  return api(`/genres/item/${id}`, { method: 'DELETE' });
};

export const bulkDeleteGenres = async (ids: string[]) => {
  return api('/genres/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
};

export const useGetGenres = (options?: { page?: number; limit?: number; admin?: boolean }) => {
  return useQuery({
    queryKey: ['genres', options],
    queryFn: () => getGenres(options)
  });
};

export const useGetGenreById = (id: string) => {
  return useQuery({
    queryKey: ['genre', id],
    queryFn: () => getGenreById(id),
    enabled: !!id
  });
};

export const useCreateGenre = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createGenre,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genres'] });
    }
  });
};

export const useUpdateGenre = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }: any) => updateGenre(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genres'] });
    }
  });
};

export const useDeleteGenre = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteGenre,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genres'] });
    }
  });
};

export const useBulkDeleteGenres = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: bulkDeleteGenres,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genres'] });
    }
  });
};

// Subscription Plans API
export const getSubscriptionPlans = async (options?: { page?: number; limit?: number }) => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  return api(`/subscription-plans?${params.toString()}`);
};

export const getSubscriptionPlanById = async (id: string) => {
  return api(`/subscription-plans/${id}`);
};

export const createSubscriptionPlan = async (data: any) => {
  return api('/subscription-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateSubscriptionPlan = async (id: string, data: any) => {
  return api(`/subscription-plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Media Library API
export const getMediaFolders = async () => {
  return api('/media/folders');
};

export const createMediaFolder = async (name: string) => {
  return api('/media/folders', {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: { 'Content-Type': 'application/json' },
  });
};

export const deleteMediaFolder = async (folderId: string) => {
  return api(`/media/folders/${folderId}`, { method: 'DELETE' });
};

export const getMediaFilesByFolder = async (folderId: string) => {
  return api(`/media/folders/${folderId}/files`);
};

export const uploadMediaFiles = async (folderId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('file', file));
  return api(`/media/folders/${folderId}/files`, {
    method: 'POST',
    body: formData,
  });
};

export const deleteMediaFile = async (fileId: string) => {
  return api(`/media/files/${fileId}`, { method: 'DELETE' });
};

// App Settings API
export const getAppSettings = async () => {
  return api('/app-settings');
};

export const updateAppSettings = async (settings: any[]) => {
  return api('/app-settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
    headers: { 'Content-Type': 'application/json' },
  });
};

export const addAppSetting = async (name: string, type: 'simple' | 'select') => {
  return api('/app-settings', {
    method: 'POST',
    body: JSON.stringify({ name, type }),
    headers: { 'Content-Type': 'application/json' },
  });
};

export const deleteAppSetting = async (id: string) => {
  return api(`/app-settings/${id}`, { method: 'DELETE' });
};

export const editAppSetting = async (id: string, updates: { name?: string; type?: 'simple' | 'select' }) => {
  return api(`/app-settings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
    headers: { 'Content-Type': 'application/json' },
  });
};

// App Settings Hooks
export const useGetAppSettings = () => {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: () => getAppSettings(),
  });
};

export const useUpdateAppSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: any[]) => updateAppSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
  });
};

export const useAddAppSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, type }: { name: string; type: 'simple' | 'select' }) =>
      addAppSetting(name, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
  });
};

export const useDeleteAppSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAppSetting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
  });
};

export const useEditAppSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; type?: 'simple' | 'select' } }) =>
      editAppSetting(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
  });
};

// Media Library Hooks
export const useGetMediaFolders = () => {
  return useQuery({
    queryKey: ['media-folders'],
    queryFn: () => getMediaFolders(),
  });
};

export const useCreateMediaFolder = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (name) => createMediaFolder(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
    },
  });
};

export const useDeleteMediaFolder = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (folderId) => deleteMediaFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
    },
  });
};

export const useGetMediaFilesByFolder = (folderId?: string) => {
  return useQuery({
    queryKey: ['media-files', folderId],
    queryFn: () => folderId ? getMediaFilesByFolder(folderId) : Promise.resolve(),
    enabled: !!folderId,
  });
};

export const useUploadMediaFiles = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { folderId: string; files: File[] }>({
    mutationFn: ({ folderId, files }) => uploadMediaFiles(folderId, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['media-files', variables.folderId] });
    },
  });
};

export const useDeleteMediaFile = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (fileId) => deleteMediaFile(fileId),
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
    },
  });
};

export const deleteSubscriptionPlan = async (id: string) => {
  return api(`/subscription-plans/${id}`, { method: 'DELETE' });
};

export const bulkDeleteSubscriptionPlans = async (ids: string[]) => {
  return api('/subscription-plans/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
};

export const useGetSubscriptionPlans = (options?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['subscriptionPlans', options],
    queryFn: () => getSubscriptionPlans(options)
  });
};

export const useGetSubscriptionPlanById = (id: string) => {
  return useQuery({
    queryKey: ['subscriptionPlan', id],
    queryFn: () => getSubscriptionPlanById(id),
    enabled: !!id
  });
};

export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createSubscriptionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    }
  });
};

export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }: any) => updateSubscriptionPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    }
  });
};

export const useDeleteSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteSubscriptionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    }
  });
};

export const useBulkDeleteSubscriptionPlans = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: bulkDeleteSubscriptionPlans,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    }
  });
};

// Plan Limits API
export const getPlanLimits = async (options?: { page?: number; limit?: number; planId?: string }) => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.planId) params.append('planId', options.planId);
  return api(`/plan-limits?${params.toString()}`);
};

export const getPlanLimitById = async (id: string) => {
  return api(`/plan-limits/${id}`);
};

export const createPlanLimit = async (data: any) => {
  return api('/plan-limits', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updatePlanLimit = async (id: string, data: any) => {
  return api(`/plan-limits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deletePlanLimit = async (id: string) => {
  return api(`/plan-limits/${id}`, { method: 'DELETE' });
};

export const bulkDeletePlanLimits = async (ids: string[]) => {
  return api('/plan-limits/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
};

export const useGetPlanLimits = (options?: { page?: number; limit?: number; planId?: string }) => {
  return useQuery({
    queryKey: ['planLimits', options],
    queryFn: () => getPlanLimits(options)
  });
};

export const useGetPlanLimitById = (id: string) => {
  return useQuery({
    queryKey: ['planLimit', id],
    queryFn: () => getPlanLimitById(id),
    enabled: !!id
  });
};

export const useCreatePlanLimit = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createPlanLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planLimits'] });
    }
  });
};

export const useUpdatePlanLimit = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }: any) => updatePlanLimit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planLimits'] });
    }
  });
};

export const useDeletePlanLimit = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deletePlanLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planLimits'] });
    }
  });
};

export const useBulkDeletePlanLimits = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: bulkDeletePlanLimits,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planLimits'] });
    }
  });
};

// FAQ API
export const getFAQs = async (options?: { page?: number; limit?: number; admin?: boolean }) => {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', options.page.toString());
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.admin) params.set('admin', 'true');
  return api(`/faqs?${params.toString()}`);
};

export const getFAQById = async (id: string) => {
  return api(`/faqs/item/${id}`);
};

export const createFAQ = async (data: { question: string; answer: string; status?: boolean }) => {
  return api('/faqs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateFAQ = async (id: string, data: { question?: string; answer?: string; status?: boolean }) => {
  return api(`/faqs/item/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteFAQ = async (id: string) => {
  return api(`/faqs/item/${id}`, { method: 'DELETE' });
};

export const bulkDeleteFAQs = async (ids: string[]) => {
  return api('/faqs/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
};

export const useGetFAQs = (options?: { page?: number; limit?: number; admin?: boolean }) => {
  return useQuery({
    queryKey: ['faqs', options],
    queryFn: () => getFAQs(options)
  });
};

export const useGetFAQById = (id: string) => {
  return useQuery({
    queryKey: ['faq', id],
    queryFn: () => getFAQById(id),
    enabled: !!id
  });
};

export const useCreateFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createFAQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    }
  });
};

export const useUpdateFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }: any) => updateFAQ(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    }
  });
};

export const useDeleteFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteFAQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    }
  });
};

export const useBulkDeleteFAQs = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: bulkDeleteFAQs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    }
  });
};

// Actors API
export const getActors = async (options?: { page?: number; limit?: number; admin?: boolean }) => {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', options.page.toString());
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.admin) params.set('admin', 'true');
  return api(`/actors?${params.toString()}`);
};

export const getActorById = async (id: string) => {
  return api(`/actors/item/${id}`);
};

export const createActor = async (formData: FormData) => {
  return api('/actors', {
    method: 'POST',
    body: formData,
  });
};

export const updateActor = async (id: string, formData: FormData) => {
  return api(`/actors/item/${id}`, {
    method: 'PUT',
    body: formData,
  });
};

export const deleteActor = async (id: string) => {
  return api(`/actors/item/${id}`, { method: 'DELETE' });
};

export const bulkDeleteActors = async (ids: string[]) => {
  return api('/actors/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
};

export const useGetActors = (options?: { page?: number; limit?: number; admin?: boolean }) => {
  return useQuery({
    queryKey: ['actors', options],
    queryFn: () => getActors(options)
  });
};

export const useGetActorById = (id: string) => {
  return useQuery({
    queryKey: ['actor', id],
    queryFn: () => getActorById(id),
    enabled: !!id
  });
};

export const useCreateActor = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createActor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actors'] });
    }
  });
};

export const useUpdateActor = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, formData }: any) => updateActor(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actors'] });
    }
  });
};

export const useDeleteActor = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteActor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actors'] });
    }
  });
};

export const useBulkDeleteActors = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: bulkDeleteActors,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actors'] });
    }
  });
};

// Directors API
export const getDirectors = async (options?: { page?: number; limit?: number; admin?: boolean }) => {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', options.page.toString());
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.admin) params.set('admin', 'true');
  return api(`/directors?${params.toString()}`);
};

export const getDirectorById = async (id: string) => {
  return api(`/directors/item/${id}`);
};

export const createDirector = async (formData: FormData) => {
  return api('/directors', {
    method: 'POST',
    body: formData,
  });
};

export const updateDirector = async (id: string, formData: FormData) => {
  return api(`/directors/item/${id}`, {
    method: 'PUT',
    body: formData,
  });
};

export const deleteDirector = async (id: string) => {
  return api(`/directors/item/${id}`, { method: 'DELETE' });
};

export const bulkDeleteDirectors = async (ids: string[]) => {
  return api('/directors/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
};

export const useGetDirectors = (options?: { page?: number; limit?: number; admin?: boolean }) => {
  return useQuery({
    queryKey: ['directors', options],
    queryFn: () => getDirectors(options)
  });
};

export const useGetDirectorById = (id: string) => {
  return useQuery({
    queryKey: ['director', id],
    queryFn: () => getDirectorById(id),
    enabled: !!id
  });
};

export const useCreateDirector = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createDirector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directors'] });
    }
  });
};

export const useUpdateDirector = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, formData }: any) => updateDirector(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directors'] });
    }
  });
};

export const useDeleteDirector = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteDirector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directors'] });
    }
  });
};

export const useBulkDeleteDirectors = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: bulkDeleteDirectors,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directors'] });
    }
  });
};

// Notification Logs API
export const getNotificationLogs = async (options?: { page?: number; limit?: number; type?: string }) => {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', options.page.toString());
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.type && options.type !== 'all') params.set('type', options.type);
  return api(`/notification-logs?${params.toString()}`);
};

export const getNotificationLogById = async (id: string) => {
  return api(`/notification-logs/item/${id}`);
};

export const createNotificationLog = async (data: any) => {
  return api('/notification-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteNotificationLog = async (id: string) => {
  return api(`/notification-logs/item/${id}`, { method: 'DELETE' });
};

export const bulkDeleteNotificationLogs = async (ids: string[]) => {
  return api('/notification-logs/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
};

export const useGetNotificationLogs = (options?: { page?: number; limit?: number; type?: string }) => {
  return useQuery({
    queryKey: ['notification-logs', options],
    queryFn: () => getNotificationLogs(options)
  });
};

export const useGetNotificationLogById = (id: string) => {
  return useQuery({
    queryKey: ['notification-log', id],
    queryFn: () => getNotificationLogById(id),
    enabled: !!id
  });
};

export const useCreateNotificationLog = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createNotificationLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    }
  });
};

export const useDeleteNotificationLog = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteNotificationLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    }
  });
};

export const useBulkDeleteNotificationLogs = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: bulkDeleteNotificationLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    }
  });
};

// Subscriptions API
export const getSubscriptions = async (options?: { 
  page?: number; 
  limit?: number;
  plan?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) => {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', options.page.toString());
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.plan && options.plan !== 'All Plans') params.set('plan', options.plan);
  if (options?.dateFrom) params.set('dateFrom', options.dateFrom);
  if (options?.dateTo) params.set('dateTo', options.dateTo);
  if (options?.search) params.set('search', options.search);
  return api(`/subscriptions?${params.toString()}`);
};

export const getSubscriptionById = async (id: string) => {
  return api(`/subscriptions/${id}`);
};

export const createSubscription = async (data: any) => {
  return api('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateSubscription = async (id: string, data: any) => {
  return api(`/subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteSubscription = async (id: string) => {
  return api(`/subscriptions/${id}`, { method: 'DELETE' });
};

export const bulkDeleteSubscriptions = async (ids: string[]) => {
  return api('/subscriptions/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
};

export const useGetSubscriptions = (options?: any) => {
  return useQuery({
    queryKey: ['subscriptions', options],
    queryFn: () => getSubscriptions(options)
  });
};

export const useGetSubscriptionById = (id: string) => {
  return useQuery({
    queryKey: ['subscription', id],
    queryFn: () => getSubscriptionById(id),
    enabled: !!id
  });
};

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }: any) => updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
};

export const useDeleteSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
};

export const useBulkDeleteSubscriptions = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: bulkDeleteSubscriptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
};
