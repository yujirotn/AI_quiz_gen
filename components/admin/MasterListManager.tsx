
import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User } from '../../types';

const MasterListManager: React.FC = () => {
  const { users, setUsers } = useAppContext();
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const header = lines.shift()?.toLowerCase();
        if (header !== '名前') {
            setMessage('エラー: CSVには「名前」というヘッダー行が必要です。');
            return;
        }

        const newUsers: User[] = lines.map((name, index) => ({
          id: `user-${Date.now()}-${index}`,
          name,
        }));

        setUsers(newUsers);
        setMessage(`正常に${newUsers.length}人のユーザーをアップロードし、更新しました。マスター名簿は上書きされました。`);
      } catch (error) {
          setMessage('エラー: CSVファイルの解析に失敗しました。「名前」ヘッダーのある有効なCSVファイルであることを確認してください。');
      }
    };
    reader.readAsText(file);
  };
  
  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">マスター名簿管理</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        CSVファイルをアップロードして、マスター名簿を更新します。ファイルには「名前」というヘッダーを持つ単一の列が必要です。新しいファイルをアップロードすると、既存のリストは上書きされます。
      </p>
      
      <div className="flex items-center space-x-4">
        <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            ref={fileInputRef}
        />
        <button
            onClick={triggerFileInput}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          CSVをアップロード
        </button>
        {message && <p className={`text-sm ${message.startsWith('エラー') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">現在のマスター名簿 ({users.length} 人)</h3>
        {users.length > 0 ? (
          <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <li key={user.id} className="px-4 py-3">
                  {user.name}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">マスター名簿にユーザーがいません。CSVファイルをアップロードしてください。</p>
        )}
      </div>
    </div>
  );
};

export default MasterListManager;