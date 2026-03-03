export default interface Image {
  id?: string;
  url: string;
  width?: number | null;
  height?: number | null;

  key?: string;
  public_id?: string;
}
