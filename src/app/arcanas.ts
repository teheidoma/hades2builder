import {signal} from '@angular/core';

export interface Arcana {
  id: number;
  name: string;
  cost: number;
  description: string;
  awakening: string;
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
  awakening: string;
  type = ArcanaType.SELECTABLE;

  constructor(id: number, name: string, cost: number, description: string) {
    this.id = id;
    this.name = name;
    this.cost = cost;
    this.description = description;
    this.awakening = '';
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
  awakening: string;
  selected = false;
  condition: (arcanas: Arcana[], ignoredIds: number[]) => boolean;
  getArcanas: () => Arcana[];
  type = ArcanaType.CONDITIONAL;

  constructor(id: number, name: string, cost: number, description: string, awakening: string, getArcanas: () => Arcana[], condition: (arcanas: Arcana[], ignoredIds: number[]) => boolean) {
    this.id = id;
    this.name = name;
    this.cost = cost;
    this.description = description;
    this.awakening = awakening;
    this.condition = condition;
    this.getArcanas = getArcanas;
  }

  isActive(ignoreIds: number[] = []): boolean {
    if (ignoreIds.length === 0) {
      ignoreIds.push(this.id);
    }
    return this.condition(this.getArcanas().filter(a => ignoreIds?.indexOf(a.id) == -1), ignoreIds);
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

let fatesCondition = (arcanas: Arcana[], ignored: number[]) => {
  ignored.push(21)
  return arcanas.find(a => a.id == 22)?.isActive()
    && arcanas.find(a => a.id == 16)?.isActive()
    && arcanas.find(a => a.id == 17)?.isActive()
    || false
}
let moonCondition = (arcanas: Arcana[]) => {
  return arcanas[3].isActive() || arcanas[9].isActive() || arcanas[8].isActive()
}

let judjementCondition = (arcanas: Arcana[]) => {
  let count = arcanas.filter(a => a instanceof SelectableArcana && a.isActive()).length;
  return count > 0 && count <= 3;
}

let divinityCondition = (arcanas: Arcana[], ignoredIds: number[]) => {
  ignoredIds.push(24)
  const idMap = new Map(arcanas
    .map(a => [a.id, a]));

  // Check rows
  for (let row = 0; row < 5; row++) {
    const rowIds = Array.from({length: 5}, (_, i) => row * 5 + i + 1);
    if (rowIds.every(id => (idMap.get(id) instanceof ConditionArcana && (<ConditionArcana>idMap.get(id)).isActive(ignoredIds)
      || idMap.get(id)?.isActive()))) {
      return true;
    }
  }

  // Check columns
  for (let col = 0; col < 5; col++) {
    const colIds = Array.from({length: 5}, (_, i) => col + 1 + i * 5);
    if (colIds.every(id => (idMap.get(id) instanceof ConditionArcana && (<ConditionArcana>idMap.get(id)).isActive(ignoredIds))
      || idMap.get(id)?.isActive())) {
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
        'While you have less than 100% <img src="magick.webp" class="inline-block" alt="">, your Attack and Special deal +30%/<span class="text-rare">+40%</span>/<span class="text-epic">+50%</span>/<span class="text-legendary">+60%</span> damage.'
      ),
      new SelectableArcana(
        4,
        'Eternity',
        3,
        'While you Channel your Ω Moves, everything moves slower for 0.8/<span class="text-rare">1.0</span>/<span class="text-epic">1.2</span>/<span class="text-legendary">1.5</span> sec.'
      ),
      new ConditionArcana(
        5,
        'The Moon',
        0,
        'Your Hex also charges up automatically as though you used 1/<span class="text-rare">2</span>/<span class="text-epic">3</span>/<span class="text-legendary">4</span> <img src="magick.webp" class="inline-block" alt=""> every 1 sec.',
        'Activate <span class="font-bold">any</span> surrounding card.',
        () => this.arcanas(),
        moonCondition
      ),
      new SelectableArcana(
        6,
        'The Furies',
        2,
        'You deal +20%/<span class="text-rare">+25%</span>/<span class="text-epic">+30%</span>/<span class="text-legendary">+35%</span> damage to foes in your Casts.'
      ),
      new SelectableArcana(
        7,
        'Persistence',
        2,
        'You have +20/<span class="text-rare">+30</span>/<span class="text-epic">+40</span>/<span class="text-legendary">+50</span> <img src="lifeup.webp" class="inline-block" alt=""> and +20/<span class="text-rare">+30</span>/<span class="text-epic">+40</span>/<span class="text-legendary">+50</span> <img src="manaup.webp" class="inline-block" alt="">.'
      ),
      new SelectableArcana(
        8,
        'The Messenger',
        1,
        'Your Casts momentarily make you Impervious and move 50%/<span class="text-rare">60%</span>/<span class="text-epic">70%</span>/<span class="text-legendary">80%</span> faster.'
      ),
      new SelectableArcana(
        9,
        'The Unseen',
        5,
        'You restore 4/<span class="text-rare">5</span>/<span class="text-epic">6</span>/<span class="text-legendary">7</span> <img src="magick.webp" class="inline-block" alt=""> every 1 sec.'
      ),
      new SelectableArcana(
        10,
        'Night',
        2,
        'You have +9%/<span class="text-rare">+12%</span>/<span class="text-epic">+15%</span>/<span class="text-legendary">+18%</span> chance to deal Critical damage with each move in an Ω Combo.'
      ),
      new SelectableArcana(
        11,
        'The Swift Runner',
        1,
        'Your Sprint is 5%/<span class="text-rare">7%</span>/<span class="text-epic">10%</span>/<span class="text-legendary">13%</span> faster and lets you pass right through most dangers in your way.'
      ),
      new SelectableArcana(
        12,
        'Death',
        4,
        'You have +1/<span class="text-rare">+2</span>/<span class="text-epic">+3</span>/<span class="text-legendary">+4</span> <img src="death.webp" class="inline-block" alt=""> Death Defiance.'
      ),
      new ConditionArcana(
        13,
        'The Centaur',
        0,
        'You gain +3/<span class="text-rare">+4</span>/<span class="text-epic">+5</span>/<span class="text-legendary">+6</span> <img src="lifeup.webp" class="inline-block" alt=""> and +3/<span class="text-rare">+4</span>/<span class="text-epic">+5</span>/<span class="text-legendary">+6</span> <img src="manaup.webp" class="inline-block" alt=""> whenever you pass through 5 Locations.',
        'Activate Cards that use 1<img src="grasp.webp" class="inline-block" alt=""> through 5<img src="grasp.webp" class="inline-block" alt="">. ',
        () => this.arcanas(),
        centaurCondition
      ),
      new SelectableArcana(
        14,
        'Origination',
        5,
        'You deal +25%/<span class="text-rare">+38%</span>/<span class="text-epic">+50%</span>/<span class="text-legendary">+63%</span> damage to foes afflicted with at least 2 Curses from different Olympians.'
      ),
      new SelectableArcana(
        15,
        'The Lovers ',
        3,
        'You take 0 damage the first 1/<span class="text-rare">2</span>/<span class="text-epic">3</span>/<span class="text-legendary">4</span> time(s) you are hit in Guardian Encounter.'
      ),
      new SelectableArcana(
        16,
        'The Enchantress ',
        3,
        'You have +1/<span class="text-rare">+2</span>/<span class="text-epic">+3</span>/<span class="text-legendary">+4</span> <img src="dice.webp" class="inline-block" alt="">, and can alter Location Rewards.'
      ),
      new SelectableArcana(
        17,
        'The Boatman',
        5,
        'You have +200/<span class="text-rare">+250</span>/<span class="text-epic">+300</span>/<span class="text-legendary">+350</span> <img src="gold.webp" class="inline-block" alt="">.'
      ),
      new SelectableArcana(
        18,
        'The Artificer',
        3,
        'You have 1/<span class="text-rare">2</span>/<span class="text-epic">3</span>/<span class="text-legendary">4</span> chance(s) this night to turn any Minor Find into a random Major Find.'
      ),
      new SelectableArcana(
        19,
        'Excellence',
        5,
        'Any Boons you find have +30%/<span class="text-rare">+40%</span>/<span class="text-epic">+50%</span>/<span class="text-legendary">+60%</span> chance to include <span class="text-legendary">Legendary</span> or at least <span class="text-rare">Rare</span> blessings.'
      ),
      new ConditionArcana(
        20,
        'The Queen',
        0,
        'Any Boons you are offered have +6%/<span class="text-rare">+8%</span>/<span class="text-epic">+10%</span>/<span class="text-legendary">+12%</span> chance to be a <span class="text-[#D2FF61]">Duo</span> (whenever possible).',
        'Activate no more than 2 Cards that use the same amount of <img src="grasp.webp" class="inline-block" alt="">. ',
        () => this.arcanas(),
        queenCondition
      ),
      new ConditionArcana(
        21,
        'The Fates',
        0,
        'You have +2/<span class="text-rare">+3</span>/<span class="text-epic">+4</span>/<span class="text-legendary">+5</span> <img src="dice.webp" class="inline-block" alt="">.',
        'Activate all surrounding Cards. ',
        () => this.arcanas(),
        fatesCondition
      ),
      new SelectableArcana(
        22,
        'The Champions',
        4,
        'You have +1/<span class="text-rare">+2</span>/<span class="text-epic">+3</span>/<span class="text-legendary">+4</span> <img src="dice.webp" class="inline-block" alt="">, and can alter Boons and certain other choices.'
      ),
      new SelectableArcana(
        23,
        'Strength',
        4,
        'While you have no <img src="death.webp" class="inline-block" alt="">, you take -30%/<span class="text-rare">-40%</span>/<span class="text-epic">-50%</span>/<span class="text-legendary">-60%</span> damage and deal <span class="text-[#73C745]">+25%</span>.'
      ),
      new ConditionArcana(
        24,
        'Divinity',
        0,
        'Any Boons you are offered have +10%/<span class="text-rare">+15%</span>/<span class="text-epic">+20%</span>/<span class="text-legendary">+25%</span> chance to be improved to <span class="text-epic">Epic</span>.',
        'Activate all <span class="font-bold">5</span> Cards in any other row or column. ',
        () => this.arcanas(),
        divinityCondition
      ),
      new ConditionArcana(
        25,
        'Judgement',
        0,
        'After you vanquish a Guardian, activate 3/<span class="text-rare">4</span>/<span class="text-epic">5</span>/<span class="text-legendary">6</span> random inactive Arcana Cards.',
        'Activate no more than <span class="font-bold">3</span> cards total.',
        () => this.arcanas(),
        judjementCondition
      )
    ]);
  }

  public click(id: number) {
    this.arcanas().find(a => a.id === id)?.onClick();
  }
}

