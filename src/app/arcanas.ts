import {signal} from '@angular/core';

class EvaluationContext {
  visiting = new Set<number>();
}

export interface Arcana {
  id: number;
  name: string;
  cost: number;
  description: string;

  isActive(): boolean;

  onClick(): void;

  getType(): ArcanaType;
}

export enum ArcanaType {
  SELECTABLE,
  CONDITIONAL
}

export class SelectableArcana implements Arcana {
  id: number;
  name: string;
  cost: number;
  description: string;
  selected = false;
  type = ArcanaType.SELECTABLE;

  constructor(id: number, name: string, cost: number, description: string) {
    this.id = id;
    this.name = name;
    this.cost = cost;
    this.description = description;
  }

  isActive(): boolean {
    return this.selected
  }

  onClick(): void {
    this.selected = !this.selected;
  }

  getType(): ArcanaType {
    return this.type;
  }
}

export class ConditionArcana implements Arcana {
  id: number;
  name: string;
  cost: number;
  description: string;
  selected = false;
  condition: (arcanas: Arcana[], context?: EvaluationContext) => boolean;
  getArcanas: () => Arcana[];
  type = ArcanaType.CONDITIONAL;

  constructor(id: number, name: string, cost: number, description: string, getArcanas: () => Arcana[], condition: (arcanas: Arcana[]) => boolean) {
    this.id = id;
    this.name = name;
    this.cost = cost;
    this.description = description;
    this.condition = condition;
    this.getArcanas = getArcanas;
  }

  isActive(context: EvaluationContext = new EvaluationContext()): boolean {
    return this.condition(this.getArcanas())
  }

  onClick(): void {
  }

  getType(): ArcanaType {
    return this.type;
  }
}

let centaurCondition = (arcanas: Arcana[]) => {
  const costs = new Set(arcanas
    .filter(a => a instanceof SelectableArcana && a.isActive())
    .map(arcana => arcana.cost));

  for (let cost = 1; cost <= 5; cost++) {
    if (!costs.has(cost)) {
      return false;
    }
  }
  return true;
}

let queenCondition = (arcanas: Arcana[]) => {
  const activated = arcanas.filter(a => a instanceof SelectableArcana && a.isActive());
  if (activated.length == 0) {
    return false
  }

  const costCounts = activated.reduce((acc, arcana) => {
    acc[arcana.cost] = (acc[arcana.cost] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  for (const count of Object.values(costCounts)) {
    if (count > 2) {
      return false;
    }
  }
  return true;
}

let fatesCondition = (arcanas: Arcana[]) => {
  return arcanas.find(a => a.id == 22)?.isActive()
    && arcanas.find(a => a.id == 16)?.isActive()
    || false
}
let moonCondition = (arcanas: Arcana[]) => {
  return arcanas[3].isActive() || arcanas[9].isActive() || arcanas[8].isActive()
}

let judjementCondition = (arcanas: Arcana[]) => {
  let count = arcanas.filter(a => a instanceof SelectableArcana && a.isActive()).length;
  return count > 0 && count < 3;
}

let divinityCondition = (arcanas: Arcana[]) => {
  const idMap = new Map(arcanas
    .map(a => [a.id, a]));

  // Check rows
  for (let row = 0; row < 5; row++) {
    const rowIds = Array.from({length: 5}, (_, i) => row * 5 + i + 1);
    if (rowIds.every(id => idMap.get(id)?.isActive() || idMap.get(id) instanceof ConditionArcana)) {
      return true;
    }
  }

  // Check columns
  for (let col = 0; col < 5; col++) {
    const colIds = Array.from({length: 5}, (_, i) => col + 1 + i * 5);
    if (colIds.every(id => idMap.get(id)?.isActive() || idMap.get(id) instanceof ConditionArcana)) {
      return true;
    }
  }

  return false;
}

export class Deck {
  public arcanas = signal<Arcana[]>([])

  constructor() {
    this.arcanas.set([
      new SelectableArcana(
        1,
        'The Sorceress',
        1,
        'Your Ω Moves are 20/<span class="text-rare">25</span>/<span class="text-epic">30</span>/<span class="text-legendary">35%</span> faster.'
      ),
      new SelectableArcana(
        2,
        'The Wayward Son',
        1,
        'After you exit a Location, restore 3/<span class="text-rare">4</span>/<span class="text-epic">5</span>/<span class="text-legendary">6%</span> <img class="inline-block" src="health.webp" alt="asd"/>.'
      ),
      new SelectableArcana(
        3,
        'The Huntress',
        2,
        'While you have less than 100% ❄, your Attack and Special deal +30%/+40%/+50%/+60% damage.'
      ),
      new SelectableArcana(
        4,
        'Eternity',
        3,
        'While you Channel your Ω Moves, everything moves slower for 0.8/1.0/1.2/1.5 sec.'
      ),
      new ConditionArcana(
        5,
        'The Moon',
        0,
        'Your Hex also charges up automatically as though you used 1/2/3/4 every 1 sec.',
        () => this.arcanas(),
        moonCondition
      ),
      new SelectableArcana(
        6,
        'The Furies',
        2,
        'You deal +20%/+25%/+30%/+35% damage to foes in your Casts.'
      ),
      new SelectableArcana(
        7,
        'Persistence',
        2,
        'You have +20/+30/+40/+50 💀 and +20/+30/+40/+50 ❄.'
      ),
      new SelectableArcana(
        8,
        'The Messenger',
        1,
        'Your Casts momentarily make you Impervious and move 50%/60%/70%/80% faster.'
      ),
      new SelectableArcana(
        9,
        'The Unseen',
        5,
        'You restore 4/5/6/7 💙 every 1 sec.'
      ),
      new SelectableArcana(
        10,
        'Night',
        2,
        'You have +9%/+12%/+15%/+18% chance to deal Critical damage with each move in an Ω Combo.'
      ),
      new SelectableArcana(
        11,
        'The Swift Runner',
        1,
        'Your Sprint is 5%/7%/10%/13% faster and lets you pass right through most dangers in your way.'
      ),
      new SelectableArcana(
        12,
        'Death',
        4,
        'You have +1/+2/+3/+4 ⚰ Death Defiance.'
      ),
      new ConditionArcana(
        13,
        'The Centaur',
        0,
        'You gain +3/+4/+5/+6 ❤️ and +3/+4/+5/+6 💙 whenever you pass through 5 Locations.',
        () => this.arcanas(),
        centaurCondition
      ),
      new SelectableArcana(
        14,
        'Origination',
        5,
        'You deal +25%/+38%/+50%/+63% damage to foes afflicted with at least 2 Curses from different Olympians.'
      ),
      new SelectableArcana(
        15,
        'The Lovers ',
        3,
        'You take 0 damage the first 1/2/3/4 time(s) you are hit in Guardian Encounter. '
      ),
      new SelectableArcana(
        16,
        'The Enchantress ',
        3,
        'You have +1/+2/+3/+4 Change of Fate, and can alter Location Rewards. '
      ),
      new SelectableArcana(
        17,
        'The Boatman  ',
        5,
        'You have +200/+250/+300/+350Gold.'
      ), new SelectableArcana(
        18,
        'The Artificer   ',
        3,
        'You have 1/2/3/4 chance(s) this night to turn any Minor Find into a random Major Find. '
      ), new SelectableArcana(
        19,
        'Excellence',
        5,
        'Any Boons you find have +30%/+40%/+50%/+60% chance to include Legendary or at least Rare blessings. '
      ), new ConditionArcana(
        20,
        'The Queen   ',
        0,
        'Any Boons you are offered have +6%/+8%/+10%/+12% chance to be a Duo (whenever possible). ',
        () => this.arcanas(),
        queenCondition
      ), new ConditionArcana(
        21,
        'The Fates   ',
        0,
        'You have +2/+3/+4/+5  Change of Fate. ',
        () => this.arcanas(),
        fatesCondition
      ), new SelectableArcana(
        22,
        'The Champions ',
        4,
        'You have +1/+2/+3/+4Change of Fate, and can alter Boons and certain other choices. '
      ), new SelectableArcana(
        23,
        'Strength  ',
        4,
        'While you have no Death Defiance, you take -30%/-40%/-50%/-60% damage and deal +25%. '
      ), new ConditionArcana(
        24,
        'Divinity  ',
        0,
        'Any Boons you are offered have +10%/+15%/+20%/+25% chance to be improved to Epic. ',
        () => this.arcanas(),
        divinityCondition
      ), new ConditionArcana(
        25,
        'Judgement  ',
        0,
        'After you vanquish a Guardian, activate 3/4/5/6 random inactive Arcana Cards.',
        () => this.arcanas(),
        judjementCondition
      )
    ])
  }

  public click(id: number) {
    this.arcanas().find(a => a.id === id)?.onClick();
  }
}

