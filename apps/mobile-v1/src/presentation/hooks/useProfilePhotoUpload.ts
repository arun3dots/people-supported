import { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { GET_MY_PROFILE, UPLOAD_MY_PROFILE_PHOTO } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { useAuth } from '../context/AuthContext';
import {
  pickImageFromCamera,
  pickDocumentOrImageFile,
  appendFileToFormData,
} from '../../lib/fileUpload';

export function useProfilePhotoUpload() {
  const { updateUserAvatar } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUpload = async (source: 'camera' | 'gallery'): Promise<boolean> => {
    try {
      const picked =
        source === 'camera'
          ? await pickImageFromCamera(5)
          : await pickDocumentOrImageFile({ acceptPdf: false, maxSizeMb: 5 });

      if (!picked) return false;

      setIsUploading(true);
      const formData = new FormData();
      await appendFileToFormData(formData, 'file', picked);

      const res = await makeMobileApiCall<{ photoUrl: string }>(
        UPLOAD_MY_PROFILE_PHOTO,
        formData
      );

      if (res?.photoUrl) {
        await updateUserAvatar(res.photoUrl);
      }

      await queryClient.invalidateQueries({ queryKey: [GET_MY_PROFILE] });
      Alert.alert('Photo Updated', 'Your profile photo has been uploaded securely.');
      return true;
    } catch (err: unknown) {
      Alert.alert(
        'Upload Failed',
        err instanceof Error ? err.message : 'Unable to upload profile photo.'
      );
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    pickAndUpload,
  };
}

