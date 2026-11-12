/** Web Cache API fixture for Hydrogen's durable cache tests. */
export class InMemoryCache {
  #entries = new Map<string, Response>();
  async match(request: Request | string) {
    return this.#entries
      .get(typeof request === "string" ? request : request.url)
      ?.clone();
  }
  async put(request: Request | string, response: Response) {
    this.#entries.set(
      typeof request === "string" ? request : request.url,
      response.clone(),
    );
  }
  async delete(request: Request | string) {
    return this.#entries.delete(
      typeof request === "string" ? request : request.url,
    );
  }
}
