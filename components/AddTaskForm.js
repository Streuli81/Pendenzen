// components/AddTaskForm.js
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { v4 as uuidv4 } from 'uuid'; // ⚠️ sichere Variante ohne extra Paket

export default function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return; // leere Eingaben ignorieren

    const newTask = {
      id: uuidv4(),
      title: title.trim(),
      done: false,
      created: new Date().toISOString(),
    };

    onAdd(newTask); // an Elternkomponente übergeben
    setTitle(''); // Feld leeren ✅
  };

  return (
    <View style={{ flexDirection: 'row', marginTop: 10 }}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Neue Aufgabe..."
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 6,
          padding: 8,
        }}
      />

      <TouchableOpacity
        onPress={handleAdd}
        style={{
          backgroundColor: '#ff8c5a',
          marginLeft: 8,
          paddingHorizontal: 14,
          borderRadius: 6,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}
