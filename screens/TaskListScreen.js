// screens/TaskListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TaskItem from '../components/TaskItem';
import AddTaskForm from '../components/AddTaskForm';

export default function TaskListScreen() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const saved = await AsyncStorage.getItem('tasks');
      if (saved) setTasks(JSON.parse(saved));
    } catch (err) {
      console.log('Fehler beim Laden:', err);
    }
  };

  const saveTasks = async (newTasks) => {
    try {
      setTasks(newTasks);
      await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
    } catch (err) {
      console.log('Fehler beim Speichern:', err);
    }
  };

  const addTask = (task) => {
    const updated = [...tasks, task];
    saveTasks(updated);
  };

  const toggleDone = (id) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    saveTasks(updated);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: 'bold',
          marginBottom: 10,
        }}
      >
        📝 Pendenzen
      </Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem task={item} onToggleDone={toggleDone} />
        )}
        ListEmptyComponent={
          <Text style={{ color: '#999', marginTop: 20 }}>
            Keine Pendenzen vorhanden.
          </Text>
        }
      />

      <AddTaskForm onAdd={addTask} />
    </View>
  );
}
