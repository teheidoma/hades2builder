import {Component, OnInit, signal} from '@angular/core';
import {NgClass} from '@angular/common';
import {Arcana, ArcanaType, Deck, SelectableArcana} from './arcanas';
import {fromPromise} from 'rxjs/internal/observable/innerFrom';
import {map} from 'rxjs';
import html2canvas from 'html2canvas-pro';

@Component({
  selector: 'app-root',
  imports: [
    NgClass
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  deck = signal(new Deck());
  selectedArcana?: Arcana;
  code = ''
  protected readonly ArcanaType = ArcanaType;

  ngOnInit() {
    let hash = location.hash.substring(1, location.hash.length);
    this.decodeSet(parseInt(hash)).forEach(i => {
      console.log(i)
      this.deck().click(i)
    });
    this.recalculateCode()
  }


  onHover(arcana: Arcana) {
    this.selectedArcana = arcana;
  }

  recalculateCode() {
    let ids = this.deck().arcanas()
      .filter(arcana => arcana.getType() === ArcanaType.SELECTABLE && arcana.isActive())
      .map(ids => ids.id);
    let encoded = this.encodeSet(ids).toString();
    let href = location.href;
    href = href.substring(0, href.lastIndexOf('#'));
    this.code = href + '#' + encoded
    location.hash = encoded
  }

  copy() {
    navigator.clipboard.write([new ClipboardItem({
      'text/plain': this.code
    })])
  }

  encodeSet(numbers: number[]): number {
    return numbers.reduce((mask, n) => mask | (1 << (n - 1)), 0);
  }

  decodeSet(mask: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < 25; i++) {
      if ((mask & (1 << i)) !== 0) {
        result.push(i + 1);
      }
    }
    return result;
  }


  getTotalCost() {
    return this.deck().arcanas()
      .filter(a => a instanceof SelectableArcana && a.isActive())
      .reduce((a, b) => a + b.cost, 0)
  }

  saveAsImage(div: HTMLDivElement) {
    fromPromise(html2canvas(div, {
    }))
      .pipe(
        map(canvas => canvas.toDataURL('image/png'))
      )
      .subscribe(url => {
        let link = document.createElement('a');
        link.href = url
        link.download = 'arcanas.png'
        link.click()
      })
  }
}
