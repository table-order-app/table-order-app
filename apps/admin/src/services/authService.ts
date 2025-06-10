import { 
  signIn, 
  signOut, 
  getCurrentUser, 
  fetchAuthSession,
  fetchUserAttributes,
  updatePassword,
  confirmSignIn,
  SignInInput,
  SignInOutput
} from 'aws-amplify/auth';
import { UserGroup } from '../config/auth';

export interface AuthUser {
  username: string;
  email: string;
  name: string;
  storeId: number;
  groups: string[];
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
  needsPasswordChange?: boolean;
}

/**
 * ユーザーログイン
 */
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const signInResult: SignInOutput = await signIn({
      username,
      password,
    } as SignInInput);

    // パスワード変更が必要な場合
    if (signInResult.isSignedIn === false && signInResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      return {
        success: false,
        needsPasswordChange: true,
        error: 'パスワードの変更が必要です'
      };
    }

    if (signInResult.isSignedIn) {
      const user = await getCurrentAuthUser();
      return {
        success: true,
        user
      };
    }

    return {
      success: false,
      error: '認証に失敗しました'
    };
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.name === 'NotAuthorizedException') {
      return {
        success: false,
        error: 'ユーザー名またはパスワードが正しくありません'
      };
    }
    
    return {
      success: false,
      error: error.message || 'ログインに失敗しました'
    };
  }
};

/**
 * 新しいパスワードを設定（初回ログイン時）
 */
export const setNewPassword = async (newPassword: string): Promise<AuthResponse> => {
  try {
    const result = await confirmSignIn({ challengeResponse: newPassword });
    
    if (result.isSignedIn) {
      const user = await getCurrentAuthUser();
      return {
        success: true,
        user
      };
    }
    
    return {
      success: false,
      error: '新しいパスワードの設定に失敗しました'
    };
  } catch (error: any) {
    console.error('Set new password error:', error);
    return {
      success: false,
      error: error.message || '新しいパスワードの設定に失敗しました'
    };
  }
};

/**
 * ログアウト
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

/**
 * 現在のユーザー情報を取得
 */
export const getCurrentAuthUser = async (): Promise<AuthUser | null> => {
  try {
    const cognitoUser = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    const session = await fetchAuthSession();
    
    // JWTトークンからグループ情報を取得
    const groups = session.tokens?.idToken?.payload['cognito:groups'] as string[] || [];
    
    return {
      username: cognitoUser.username,
      email: attributes.email || '',
      name: attributes.name || '',
      storeId: parseInt(attributes['custom:store_id'] || '0'),
      groups
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * 認証状態をチェック
 */
export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const session = await fetchAuthSession();
    return session.tokens !== undefined;
  } catch (error) {
    return false;
  }
};

/**
 * パスワード変更
 */
export const changePassword = async (oldPassword: string, newPassword: string): Promise<AuthResponse> => {
  try {
    await updatePassword({ oldPassword, newPassword });
    return {
      success: true
    };
  } catch (error: any) {
    console.error('Change password error:', error);
    return {
      success: false,
      error: error.message || 'パスワードの変更に失敗しました'
    };
  }
};

/**
 * 権限チェック：管理者権限
 */
export const isAdmin = (user: AuthUser): boolean => {
  return user.groups.includes(UserGroup.SUPER_ADMIN);
};

/**
 * 権限チェック：店舗管理者権限
 */
export const isStoreManager = (user: AuthUser): boolean => {
  return user.groups.includes(UserGroup.SUPER_ADMIN) || 
         user.groups.includes(UserGroup.STORE_MANAGER);
};

/**
 * 権限チェック：スタッフ権限
 */
export const isStaff = (user: AuthUser): boolean => {
  return user.groups.length > 0; // 何らかのグループに所属していればスタッフ
};