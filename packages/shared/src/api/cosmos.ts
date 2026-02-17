type Body = Spicetify.CosmosAsync.Body;

export const cosmos = {
  get: <T = unknown>(url: string): Promise<T> => Spicetify.CosmosAsync.get(url) as Promise<T>,

  post: <T = unknown>(url: string, body?: Body): Promise<T> =>
    Spicetify.CosmosAsync.post(url, body) as Promise<T>,

  put: <T = unknown>(url: string, body?: Body): Promise<T> =>
    Spicetify.CosmosAsync.put(url, body) as Promise<T>,

  del: <T = unknown>(url: string, body?: Body): Promise<T> =>
    Spicetify.CosmosAsync.del(url, body) as Promise<T>,
};
