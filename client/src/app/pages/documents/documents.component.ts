import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { AuthService } from '../../services/auth.service';
import { Document, PaginatedResponse } from '../../models';

const ICON_MAP: Record<string, string> = {
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'text/plain': '📃',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/webp': '🖼️',
};

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="section-title">Documents</h1>
          <p class="text-gray-400 mt-1">Upload and manage organization files</p>
        </div>
        <button (click)="showUpload = true" class="btn-primary flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
          Upload Document
        </button>
      </div>

      <!-- Search -->
      <div class="relative max-w-xs">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input [(ngModel)]="search" (ngModelChange)="load()" type="text" placeholder="Search documents..." class="input-field pl-9 text-sm" />
      </div>

      @if (loading()) {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="card p-5 space-y-3">
              <div class="skeleton h-8 w-8 rounded"></div>
              <div class="skeleton h-4 w-3/4 rounded"></div>
              <div class="skeleton h-3 w-1/2 rounded"></div>
            </div>
          }
        </div>
      } @else if (result()?.data?.length === 0) {
        <div class="text-center py-16 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>No documents yet</p>
        </div>
      } @else {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          @for (doc of result()?.data; track doc.id) {
            <div class="card p-5 hover:border-brand-700/50 transition-all duration-200 flex flex-col gap-3 group">
              <div class="flex items-start justify-between">
                <span class="text-3xl">{{ fileIcon(doc.fileType) }}</span>
                <div class="flex items-center gap-2">
                  @if (doc.isPublic) { <span class="badge-success text-xs">Public</span> }
                  @else { <span class="badge-gray text-xs">Private</span> }
                </div>
              </div>

              <div class="flex-1">
                <h3 class="font-medium text-white text-sm group-hover:text-brand-300 transition-colors leading-snug">{{ doc.title }}</h3>
                @if (doc.description) {
                  <p class="text-gray-500 text-xs mt-1 line-clamp-2">{{ doc.description }}</p>
                }
              </div>

              <div class="text-xs text-gray-500 space-y-1">
                <div class="flex items-center justify-between">
                  <span>{{ doc.uploadedBy?.firstName }} {{ doc.uploadedBy?.lastName }}</span>
                  <span>{{ formatSize(doc.fileSize) }}</span>
                </div>
                <div>{{ formatDate(doc.createdAt) }}</div>
              </div>

              <div class="flex gap-2 pt-2 border-t border-surface-border">
                <a [href]="doc.fileUrl" target="_blank" class="btn-secondary text-xs flex-1 text-center py-1.5">Download</a>
                @if (auth.isAdmin || doc.uploadedById === auth.currentUser?.id) {
                  <button (click)="deleteDoc(doc.id)" class="btn-danger text-xs px-3 py-1.5 border border-red-800/30 rounded-xl">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        @if (result()?.meta?.totalPages! > 1) {
          <div class="flex justify-center gap-2">
            <button (click)="goPage(page - 1)" [disabled]="!result()?.meta?.hasPrev" class="btn-secondary text-sm px-4 py-2">← Prev</button>
            <span class="flex items-center text-gray-400 text-sm px-4">{{ page }} / {{ result()?.meta?.totalPages }}</span>
            <button (click)="goPage(page + 1)" [disabled]="!result()?.meta?.hasNext" class="btn-secondary text-sm px-4 py-2">Next →</button>
          </div>
        }
      }
    </div>

    <!-- Upload Modal -->
    @if (showUpload) {
      <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="card w-full max-w-md p-8 animate-slide-up">
          <h2 class="font-display text-xl font-600 text-white mb-6">Upload Document</h2>

          <!-- Drop zone -->
          <div
            class="border-2 border-dashed border-surface-border rounded-2xl p-8 text-center hover:border-brand-600 transition-colors cursor-pointer mb-4"
            (dragover)="$event.preventDefault()"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <input #fileInput type="file" class="hidden" (change)="onFileChange($event)" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp" />
            @if (selectedFile) {
              <div class="text-brand-400">
                <div class="text-2xl mb-1">{{ fileIcon(selectedFile.type) }}</div>
                <div class="text-sm font-medium text-white">{{ selectedFile.name }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ formatSize(selectedFile.size) }}</div>
              </div>
            } @else {
              <svg class="w-10 h-10 mx-auto mb-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
              <div class="text-gray-400 text-sm">Click or drag file here</div>
              <div class="text-gray-600 text-xs mt-1">PDF, DOC, DOCX, TXT, Images — max 20MB</div>
            }
          </div>

          <div class="space-y-3">
            <input [(ngModel)]="uploadTitle" placeholder="Document title *" class="input-field" />
            <input [(ngModel)]="uploadDesc" placeholder="Description (optional)" class="input-field" />
            <label class="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" [(ngModel)]="uploadPublic" class="rounded" />
              Make this document public
            </label>
          </div>

          <div class="flex gap-3 mt-6">
            <button (click)="showUpload = false; selectedFile = null" class="btn-secondary flex-1">Cancel</button>
            <button (click)="uploadDoc()" [disabled]="!selectedFile || !uploadTitle || uploading()" class="btn-primary flex-1">
              {{ uploading() ? 'Uploading...' : 'Upload' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DocumentsComponent implements OnInit {
  result = signal<PaginatedResponse<Document> | null>(null);
  loading = signal(true);
  uploading = signal(false);
  showUpload = false;
  search = '';
  page = 1;
  selectedFile: File | null = null;
  uploadTitle = '';
  uploadDesc = '';
  uploadPublic = false;

  constructor(private docSvc: DocumentService, public auth: AuthService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: any = { page: this.page, limit: 12 };
    if (this.search) params.search = this.search;
    this.docSvc.list(params).subscribe({ next: r => { this.result.set(r); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  goPage(p: number) { this.page = p; this.load(); }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.selectedFile = input.files[0];
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer?.files.length) this.selectedFile = e.dataTransfer.files[0];
  }

  uploadDoc() {
    if (!this.selectedFile || !this.uploadTitle) return;
    this.uploading.set(true);
    this.docSvc.upload(this.selectedFile, this.uploadTitle, this.uploadDesc || undefined, undefined, this.uploadPublic).subscribe({
      next: () => { this.uploading.set(false); this.showUpload = false; this.selectedFile = null; this.uploadTitle = ''; this.uploadDesc = ''; this.load(); },
      error: (e) => { this.uploading.set(false); alert(e.error?.message || 'Upload failed'); },
    });
  }

  deleteDoc(id: string) {
    if (!confirm('Delete this document?')) return;
    this.docSvc.delete(id).subscribe({ next: () => this.load(), error: (e) => alert(e.error?.message) });
  }

  fileIcon(type: string) { return ICON_MAP[type] || '📁'; }
  formatSize(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
  formatDate(d: string) { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }); }
}
