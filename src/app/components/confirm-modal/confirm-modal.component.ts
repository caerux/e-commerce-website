import {
  Component,
  EventEmitter,
  Input,
  Output,
  Renderer2,
  Inject,
  OnDestroy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent implements OnDestroy {
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure you want to proceed?';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    // Disable scrolling when the modal is opened
    this.renderer.addClass(this.document.body, 'modal-open');
  }

  ngOnDestroy(): void {
    // Re-enable scrolling when the modal is destroyed
    this.renderer.removeClass(this.document.body, 'modal-open');
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
