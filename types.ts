
export type Studio = 'Resume' | 'Image' | 'Video' | 'Interior' | 'Clothing';

export interface FileWithPreview extends File {
  preview: string;
}
