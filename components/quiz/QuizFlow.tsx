
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import QuizTaker from './QuizTaker';
import { Project } from '../../types';
import pako from 'pako';

const decodeProjectData = (encodedData: string): Project | null => {
    try {
        let base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const compressedString = atob(base64);
        const compressed = new Uint8Array(compressedString.length);
        for (let i = 0; i < compressedString.length; i++) {
            compressed[i] = compressedString.charCodeAt(i);
        }

        const jsonString = pako.inflate(compressed, { to: 'string' });
        const decoded = JSON.parse(jsonString);

        if (decoded.id && decoded.name && Array.isArray(decoded.questions)) {
            return {
                ...decoded,
                transcript: '',
                url_slug: '',
                is_published: true, 
                createdAt: new Date().toISOString(),
            };
        }
        return null;
    } catch (error) {
        console.error("Failed to decode project data from URL:", error);
        return null;
    }
};


const QuizStart: React.FC<{
  onStart: (userId: string) => void;
  projectTitle: string;
  projectId: string;
}> = ({ onStart, projectTitle, projectId }) => {
  const { users, submissions } = useAppContext();
  const [selectedUser, setSelectedUser] = useState('');
  const [error, setError] = useState('');

  const availableUsers = users.filter(user => 
    !submissions.some(s => s.userId === user.id && s.projectId === projectId)
  );

  const handleStart = () => {
    if (!selectedUser) {
      setError('名前を選択してください。');
      return;
    }
    setError('');
    onStart(selectedUser);
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4">{projectTitle}</h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">クイズを始めるには、あなたの名前を選択してください。</p>
      <div className="max-w-xs mx-auto">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary focus:border-primary"
        >
          <option value="">名前を選択...</option>
          {availableUsers.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          onClick={handleStart}
          className="w-full mt-6 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all text-lg"
        >
          クイズを開始
        </button>
      </div>
    </div>
  );
};

const QuizComplete: React.FC = () => (
  <div className="text-center">
    <h2 className="text-3xl font-bold mb-4 text-green-500">提出完了！</h2>
    <p className="text-lg text-gray-600 dark:text-gray-300">クイズお疲れ様でした。見事です！</p>
  </div>
);

const QuizFlow: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const { projects, submissions, setSubmissions, attempts, setAttempts } = useAppContext();
    const [pageState, setPageState] = useState<'start' | 'taking' | 'complete'>('start');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const project = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const data = params.get('data');
        if (data) {
            const decodedProject = decodeProjectData(data);
            if (decodedProject) return decodedProject;
        }
        return projects.find(p => p.url_slug === slug);
    }, [slug, location.search, projects]);
    
    useEffect(() => {
        if(currentUserId && project) {
            const hasSubmitted = submissions.some(s => s.userId === currentUserId && s.projectId === project.id);
            if (hasSubmitted) {
                setPageState('complete');
            }
        }
    }, [currentUserId, project, submissions]);

    const handleStartQuiz = (userId: string) => {
        setCurrentUserId(userId);
        setPageState('taking');
    };

    const handleGrade = (score: number) => {
      if (project && currentUserId) {
        const newAttempt = {
          id: `att-${Date.now()}`,
          projectId: project.id,
          userId: currentUserId,
          score,
          attemptedAt: new Date().toISOString()
        };
        setAttempts(prev => [...prev, newAttempt]);
      }
    };

    const handleSubmit = () => {
        if (!project || !currentUserId) return;
        const userAttempts = attempts.filter(a => a.userId === currentUserId && a.projectId === project.id);
        const newSubmission = {
            id: `sub-${Date.now()}`,
            projectId: project.id,
            userId: currentUserId,
            submittedAt: new Date().toISOString(),
            attempt_count: userAttempts.length
        };
        setSubmissions(prev => [...prev, newSubmission]);
        setPageState('complete');
    };
    
    const renderContent = () => {
        if (!project || !project.is_published) {
            return <div className="text-center"><h2 className="text-2xl font-bold">クイズは利用できません</h2><p>このクイズは見つからないか、現在公開されていません。</p></div>;
        }

        switch (pageState) {
            case 'start':
                return <QuizStart onStart={handleStartQuiz} projectTitle={project.name} projectId={project.id} />;
            case 'taking':
                return <QuizTaker projectTitle={project.name} questions={project.questions} onSubmit={handleSubmit} onGrade={handleGrade} isStickyFooter={true} />;
            case 'complete':
                return <QuizComplete />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default QuizFlow;