import { Platform, Linking, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getApiBaseUrl } from '../data/api/client';
import { getAccessToken } from '../data/security/secureStorage';
import { formatUkDate } from './date';

export interface PickedMobileFile {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  dateStr: string;
  webFile?: File;
}

interface NativeFormDataFilePart {
  uri: string;
  name: string;
  type: string;
  bytes: () => Promise<Uint8Array>;
}

function readLocalUriBytes(uri: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.response instanceof ArrayBuffer) {
        resolve(new Uint8Array(xhr.response));
      } else {
        reject(new Error('Failed to read local file bytes'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error reading local file URI'));
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export function inferMimeType(fileName: string, providedMime?: string | null): string {
  if (providedMime && providedMime !== 'application/octet-stream') {
    if (providedMime === 'image/jpg') return 'image/jpeg';
    if (['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(providedMime)) {
      return providedMime;
    }
  }
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function ensureExtension(rawName: string, mimeType: string): string {
  const cleaned = rawName.trim() || `clinical_upload_${Date.now()}`;
  if (/\.(pdf|jpe?g|png|webp)$/i.test(cleaned)) return cleaned;
  const ext = mimeType === 'application/pdf' ? 'pdf' : mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  return `${cleaned}.${ext}`;
}

function mapImageAssetToPickedFile(
  asset: ImagePicker.ImagePickerAsset,
  defaultPrefix: string,
  maxSizeMb: number
): PickedMobileFile | null {
  const webFile = (asset as ImagePicker.ImagePickerAsset & { file?: File }).file;
  const sizeBytes = asset.fileSize ?? webFile?.size;
  if (sizeBytes && sizeBytes > maxSizeMb * 1024 * 1024) {
    Alert.alert('File Too Large', `Selected file exceeds the ${maxSizeMb} MB limit.`);
    return null;
  }

  const rawName = asset.fileName || webFile?.name || `${defaultPrefix}_${Date.now()}.jpg`;
  const mimeType = inferMimeType(rawName, asset.mimeType || webFile?.type);
  const fileName = ensureExtension(rawName, mimeType);

  return {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    uri: asset.uri,
    fileName,
    mimeType,
    fileSize: sizeBytes,
    dateStr: formatUkDate(new Date()),
    webFile,
  };
}

function pickWebFile(options: {
  accept: string;
  maxSizeMb: number;
  capture?: 'environment' | 'user';
  defaultPrefix?: string;
  allowPdf?: boolean;
}): Promise<PickedMobileFile | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options.accept;
    if (options.capture) {
      input.setAttribute('capture', options.capture);
    }

    input.style.position = 'fixed';
    input.style.top = '-9999px';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';

    let settled = false;
    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    const finish = (result: PickedMobileFile | null) => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(result);
      }
    };

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }

      if (file.size > options.maxSizeMb * 1024 * 1024) {
        Alert.alert('File Too Large', `Selected file exceeds the ${options.maxSizeMb} MB limit.`);
        finish(null);
        return;
      }

      const mimeType = inferMimeType(file.name, file.type);
      if (!options.allowPdf && mimeType === 'application/pdf') {
        Alert.alert('Invalid Format', 'Only JPG, PNG, and WEBP images are allowed.');
        finish(null);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const prefix = options.defaultPrefix || 'upload';
      const rawName = file.name || `${prefix}_${Date.now()}`;
      const fileName = ensureExtension(rawName, mimeType);

      finish({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        uri: objectUrl,
        fileName,
        mimeType,
        fileSize: file.size,
        dateStr: formatUkDate(new Date()),
        webFile: file,
      });
    };

    input.oncancel = () => finish(null);

    document.body.appendChild(input);
    input.click();
  });
}

export async function pickImageFromCamera(maxSizeMb = 5): Promise<PickedMobileFile | null> {
  if (Platform.OS === 'web') {
    return pickWebFile({
      accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
      maxSizeMb,
      capture: 'environment',
      defaultPrefix: 'camera_photo',
      allowPdf: false,
    });
  }

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Denied', 'Camera permission is required to capture clinical photos.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }
  return mapImageAssetToPickedFile(result.assets[0], 'camera_photo', maxSizeMb);
}

export async function pickImageFromGallery(maxSizeMb = 5): Promise<PickedMobileFile | null> {
  if (Platform.OS === 'web') {
    return pickWebFile({
      accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
      maxSizeMb,
      defaultPrefix: 'gallery_photo',
      allowPdf: false,
    });
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Denied', 'Gallery permission is required to select images.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }
  return mapImageAssetToPickedFile(result.assets[0], 'gallery_photo', maxSizeMb);
}

export async function pickDocumentOrImageFile(options?: {
  acceptPdf?: boolean;
  maxSizeMb?: number;
}): Promise<PickedMobileFile | null> {
  const acceptPdf = options?.acceptPdf ?? true;
  const maxSizeMb = options?.maxSizeMb ?? 10;

  if (Platform.OS === 'web') {
    return pickWebFile({
      accept: acceptPdf
        ? 'application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp'
        : 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
      maxSizeMb,
      defaultPrefix: 'attachment',
      allowPdf: acceptPdf,
    });
  }

  return pickImageFromGallery(maxSizeMb);
}

export async function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  file: PickedMobileFile
): Promise<void> {
  if (file.webFile) {
    formData.append(fieldName, file.webFile, file.fileName);
    return;
  }
  if (Platform.OS === 'web') {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const typedBlob = blob.type ? blob : new Blob([blob], { type: file.mimeType });
    formData.append(fieldName, typedBlob, file.fileName);
    return;
  }
  // Universal part compatible with both expo/fetch ('bytes' + 'name' + 'type') and RN fetch ('uri' + 'name' + 'type')
  const nativePart: NativeFormDataFilePart = {
    uri: file.uri,
    name: file.fileName,
    type: file.mimeType,
    bytes: () => readLocalUriBytes(file.uri),
  };
  formData.append(fieldName, nativePart as unknown as Blob);
}

export function normalizeBackendMediaUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  let trimmed = rawUrl.trim();
  const apiBase = getApiBaseUrl(); // ends with /api
  const serverOrigin = apiBase.replace(/\/api\/?$/, '');

  trimmed = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, serverOrigin);

  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('file://') &&
    !trimmed.startsWith('blob:') &&
    !trimmed.startsWith('data:')
  ) {
    const cleanRel = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    trimmed = cleanRel.startsWith('/api/')
      ? `${serverOrigin}${cleanRel}`
      : `${apiBase}${cleanRel}`;
  }
  return trimmed;
}

export async function openAuthenticatedDocument(
  rawUrl: string,
  fallbackTitle = 'Document'
): Promise<void> {
  const resolvedUrl = normalizeBackendMediaUrl(rawUrl);
  if (!resolvedUrl) {
    Alert.alert('Unavailable', `No stream URL is available for ${fallbackTitle}.`);
    return;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const token = await getAccessToken();
    const res = await fetch(resolvedUrl, {
      method: 'GET',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error(`Unable to stream document (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const supported = await Linking.canOpenURL(resolvedUrl);
  if (supported) {
    await Linking.openURL(resolvedUrl);
  } else {
    Alert.alert('Cannot Open URL', `Unable to open ${fallbackTitle} on this device.`);
  }
}

export function formatBytes(bytes?: number): string | undefined {
  if (bytes === undefined || Number.isNaN(bytes) || bytes <= 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

