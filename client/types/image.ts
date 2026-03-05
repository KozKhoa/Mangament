export default interface Image {
  id?: string;
  url?: string;
  width?: number | null;
  height?: number | null;

  file?: File;

  key?: string;
  public_id?: string;
}
