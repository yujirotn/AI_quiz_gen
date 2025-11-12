import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User } from '../../types';

const MasterListManager: React.FC = () => {
  const { users, setUsers } = useAppContext();
  const [message, setMessage] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');

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

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim() === '') return;
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: newUserName.trim(),
    };
    setUsers([...users, newUser]);
    setNewUserName('');
    setMessage(`${newUser.name}さんを追加しました。`);
  };

  const handleDeleteUser = (userIdToDelete: string) => {
    const userToDelete = users.find(user => user.id === userIdToDelete);
    if (!userToDelete) return;

    if (window.confirm(`${userToDelete.name}さんを名簿から削除しますか？`)) {
      setUsers(currentUsers => currentUsers.filter(user => user.id !== userIdToDelete));
      setMessage(`${userToDelete.name}さんを削除しました。`);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUserId(user.id);
    setEditingUserName(user.name);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUserName('');
  };

  const handleUpdateUser = (userIdToUpdate: string) => {
    if (editingUserName.trim() === '') {
      setMessage('エラー: 名前は空にできません。');
      return;
    }
    setUsers(currentUsers =>
      currentUsers.map(user =>
        user.id === userIdToUpdate ? { ...user, name: editingUserName.trim() } : user
      )
    );
    setMessage(`ユーザー名を更新しました。`);
    handleCancelEdit();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">マスター名簿管理</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        CSVファイルをアップロードして、マスター名簿を更新します。ファイルには「名前」というヘッダーを持つ単一の列が必要です。新しいファイルをアップロードすると、既存のリストは上書きされます。
      </p>
      
      <div className="flex items-center space-x-4 mb-8">
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
      
      <div className="mt-8 border-t dark:border-gray-700 pt-6">
        <h3 className="text-xl font-semibold mb-4">名簿の直接編集</h3>
        <form onSubmit={handleAddUser} className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="新しい名前を入力"
            className="flex-grow p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600"
          />
          <button type="submit" className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover transition-colors">
            追加
          </button>
        </form>

        <h3 className="text-xl font-semibold mb-2 mt-6">現在のマスター名簿 ({users.length} 人)</h3>
        {users.length > 0 ? (
          <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <li key={user.id} className="px-4 py-3 flex justify-between items-center">
                  {editingUserId === user.id ? (
                    <>
                      <input
                        type="text"
                        value={editingUserName}
                        onChange={(e) => setEditingUserName(e.target.value)}
                        className="flex-grow p-1 border rounded-md dark:bg-gray-900 dark:border-gray-600"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateUser(user.id)}
                      />
                      <div className="flex items-center ml-2 space-x-2 flex-shrink-0">
                        <button onClick={() => handleUpdateUser(user.id)} className="text-green-500 hover:text-green-700 text-sm font-medium">
                          保存
                        </button>
                        <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                          キャンセル
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="truncate">{user.name}</span>
                      <div className="flex items-center space-x-4 flex-shrink-0">
                        <button onClick={() => handleEditClick(user)} className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                          編集
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                          削除
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">マスター名簿にユーザーがいません。CSVファイルをアップロードするか、手動で追加してください。</p>
        )}
      </div>
    </div>
  );
};

export default MasterListManager;