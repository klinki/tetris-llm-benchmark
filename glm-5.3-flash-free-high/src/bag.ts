import { KINDS, type Kind } from './pieces.js';

/** Guideline randomizer: shuffled bags of seven, so a bag never repeats a kind. */
export class Bag {
  private queue: Kind[] = [];

  constructor(initial: Kind[] = []) {
    this.queue.push(...initial);
    this.refill();
  }

  next(): Kind {
    this.refill();
    return this.queue.shift()!;
  }

  /** The next `count` kinds without drawing them (for the upcoming-queue display). */
  upcoming(count: number): readonly Kind[] {
    this.refill();
    return this.queue.slice(0, count);
  }

  private refill(): void {
    while (this.queue.length < 5) this.queue.push(...shuffle(KINDS.slice()));
  }
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
