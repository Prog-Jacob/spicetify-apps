/** Runs one of Spotify's persisted GraphQL queries by name; the shape of `T` is the caller's guess. */
export const gql = <T = unknown>(
  name: Spicetify.GraphQL.Query,
  variables: Record<string, unknown>,
): Promise<T> => Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions[name], variables);
