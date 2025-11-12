
import React, { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { User, Project, Submission, Attempt } from '../types';

interface AppContextType {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  attempts: Attempt[];
  setAttempts: React.Dispatch<React.SetStateAction<Attempt[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('quizApp_users', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('quizApp_projects', []);
  const [submissions, setSubmissions] = useLocalStorage<Submission[]>('quizApp_submissions', []);
  const [attempts, setAttempts] = useLocalStorage<Attempt[]>('quizApp_attempts', []);

  return (
    <AppContext.Provider value={{ users, setUsers, projects, setProjects, submissions, setSubmissions, attempts, setAttempts }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
