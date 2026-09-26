export default interface Image {
  id?: string;
  path?: string;
  provider?: string;
  mine_type?: string;
  width?: number | null;
  height?: number | null;

  file?: File;
}
