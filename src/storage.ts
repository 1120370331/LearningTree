import { parseData, type Data } from "./domain";
import { demoData } from "./demo";

export const STORAGE_KEY = "learning-tree:v1";
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
export function loadData(): Data {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === null ? demoData() : parseData(JSON.parse(raw));
}
export function saveData(data: Data) {
  const valid = parseData(data);
  const raw = JSON.stringify(valid);
  if (new Blob([raw]).size > MAX_BACKUP_BYTES)
    throw new Error("数据已达到 2 MB 上限，请先导出备份再清理旧记录");
  localStorage.setItem(STORAGE_KEY, raw);
  return valid;
}
export async function readBackup(file: File): Promise<Data> {
  if (file.size > MAX_BACKUP_BYTES) throw new Error("备份文件不能超过 2 MB");
  return parseData(JSON.parse(await file.text()));
}
export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
