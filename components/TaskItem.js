// components/TaskItem.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function TaskItem({ task, onToggleDone }) {
  return (
    <TouchableOpacity
      onPress={() => onToggleDone(task.id)}
      style={{
        backgroundColor: task.done ? '#d1f5d3' : '#f2f2f2',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 16 }}>
        {task.done ? '✅ ' : '⬜️ '}
        {task.title}
      </Text>
      {task.description ? (
        <Text style={{ color: '#555' }}>{task.description}</Text>
      ) : null}
    </TouchableOpacity>
  );
}
