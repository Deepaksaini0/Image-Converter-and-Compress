// We don't need persistent storage for this stateless tool,
// but we'll keep the interface standard.
export interface IStorage {
  // Empty for now
}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
