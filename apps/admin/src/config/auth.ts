import { Amplify } from 'aws-amplify';

// Cognito設定
export const cognitoConfig = {
  region: import.meta.env.VITE_COGNITO_REGION || 'ap-northeast-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

// Amplify設定
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.userPoolId,
      userPoolClientId: cognitoConfig.userPoolWebClientId,
    }
  }
};

// Amplifyの初期化
export const initializeAuth = () => {
  if (!cognitoConfig.userPoolId || !cognitoConfig.userPoolWebClientId) {
    console.error('Cognito設定が不完全です。環境変数を確認してください。');
    return false;
  }
  
  Amplify.configure(amplifyConfig);
  return true;
};

// ユーザーグループの定義
export enum UserGroup {
  SUPER_ADMIN = 'super-admin',
  STORE_MANAGER = 'store-manager',
  STAFF = 'staff',
}

// 権限チェック関数
export const hasPermission = (userGroups: string[], requiredGroup: UserGroup): boolean => {
  // super-adminは全権限を持つ
  if (userGroups.includes(UserGroup.SUPER_ADMIN)) {
    return true;
  }
  
  // 指定されたグループに所属しているかチェック
  return userGroups.includes(requiredGroup);
};

// 店舗IDチェック関数
export const canAccessStore = (userStoreId: number, targetStoreId: number, userGroups: string[]): boolean => {
  // super-adminは全店舗にアクセス可能
  if (userGroups.includes(UserGroup.SUPER_ADMIN)) {
    return true;
  }
  
  // 自分の店舗のみアクセス可能
  return userStoreId === targetStoreId;
};