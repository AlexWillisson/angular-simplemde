import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as SimpleMDE from 'simplemde';
import { Observable } from 'rxjs';
import { MdeConfig } from './mde-config';
import { DefaultActions, ISimpleMdeConfig } from './editor-config.model';

@Component({
  selector: 'angular-simplemde',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements OnInit, OnChanges {
  @Input() input: string;

  @Input() config: ISimpleMdeConfig;

  @Output() inputChange = new EventEmitter<string>();

  @ViewChild('body', { static: true })
  body: ElementRef;
  mde: any;

  constructor() {}

  ngOnInit() {
    setTimeout(() => {
      this.body.nativeElement.value = this.input;
      const mdeConfig: MdeConfig = {
        element: this.body.nativeElement,
        forceSync: true,
        spellChecker: false,
        toolbar: this.getToolBar(),
      };

      if (this.config && this.config.previewRenderer) {
        mdeConfig.previewRender = this.config.previewRenderer;
      }

      this.mde = new SimpleMDE(mdeConfig);
      this.mde.codemirror.on('change', () => {
        this.emitValue(this.mde.value());
      });
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        switch (propName) {
          case 'input': {
            if (this.mde && this.input === '') {
              this.mde.value(this.input);
            }
          }
        }
      }
    }
  }

  private getToolBar() {
    const toolbar = [];

    let actions = DefaultActions;

    if (this.config && this.config.actions) {
      actions = this.config.actions;
    }
    for (const action of actions) {
      if (action === '|') {
        toolbar.push(action);
      } else {
        const clickAction = !action.simpleMdeAction
          ? () => {}
          : action.simpleMdeAction;
        toolbar.push({
          name: action.name,
          title: action.title,
          className: `fa ${action.icon} x-simplemde-action-${action.name}`,
          action: clickAction,
        });
      }
    }

    return toolbar;
  }

  emitValue(value: any) {
    this.inputChange.emit(value);
  }

  @HostListener('document:click', ['$event'])
  toolBarListener($event) {
    const classList = $event.target.classList;

    if (this.config && this.config.actions) {
      for (const action of this.config.actions) {
        if (action === '|') {
          continue;
        }

        if (classList.contains(`x-simplemde-action-${action.name}`)) {
          const cm = this.mde.codemirror;
          const selectedText = cm.getSelection();

          const output = action.action(selectedText);

          if (output instanceof Observable) {
            output.subscribe((outputString) =>
              cm.replaceSelection(outputString)
            );
          } else {
            cm.replaceSelection(output);
          }
        }
      }
    }
  }
}
