'use client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Cartao from '../Cartao/Cartao';
import { useState } from 'react';

const KanbanBoard = ({ cards, onDragEnd, darkMode }) => {
    const [collapsed, setCollapsed] = useState({});

    const columns = {
        disponiveis: {
            title: 'Disponíveis',
            items: cards.filter(card => card.status === 'disponiveis'),
            color: 'blue',
            icon: '📥'
        },
        emAndamento: {
            title: 'Em Andamento',
            items: cards.filter(card => card.status === 'emAndamento'),
            color: 'yellow',
            icon: '⚙️'
        },
        pesado: {
            title: 'Pesado',
            items: cards.filter(card => card.status === 'pesado'),
            color: 'green',
            icon: '✅'
        }
    };

    const toggleCollapse = (columnId) => {
        setCollapsed(prev => ({ ...prev, [columnId]: !prev[columnId] }));
    };

    const getColumnStyle = (color) => {
        const styles = {
            blue: 'border-blue-500 hover:border-blue-600',
            yellow: 'border-yellow-500 hover:border-yellow-600',
            green: 'border-green-500 hover:border-green-600'
        };
        return styles[color];
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
                {Object.entries(columns).map(([columnId, column]) => (
                    <div
                        key={columnId}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg 
                                 transition-all duration-300 ease-in-out h-[calc(100vh-12rem)]
                                 flex flex-col
                                 ${darkMode ? 'dark' : ''}`}
                    >
                        <div
                            className={`border-t-4 ${getColumnStyle(column.color)} 
                                      rounded-t-lg transition-colors duration-200`}
                        >
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer"
                                onClick={() => toggleCollapse(columnId)}
                            >
                                <div className="flex items-center space-x-2">
                                    <span className="text-2xl">{column.icon}</span>
                                    <h2 className="text-lg font-bold dark:text-white">
                                        {column.title}
                                    </h2>
                                    <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-sm">
                                        {column.items.length}
                                    </span>
                                </div>
                                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                    {collapsed[columnId] ? '▼' : '▲'}
                                </button>
                            </div>
                        </div>

                        <Droppable droppableId={columnId}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 p-4 overflow-y-auto
                                              scrollbar-thin scrollbar-thumb-rounded-full
                                              scrollbar-track-transparent
                                              ${darkMode 
                                                ? 'scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500' 
                                                : 'scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400'}
                                              ${snapshot.isDraggingOver ? 'bg-gray-50 dark:bg-gray-700/50' : ''}
                                              transition-colors duration-200`}
                                >
                                    {column.items.map((card, index) => (
                                        <Draggable
                                            key={card.id}
                                            draggableId={String(card.id)}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`mb-4 transform transition-all duration-200
                                                              ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-lg' : ''}
                                                              hover:shadow-md`}
                                                >
                                                    <Cartao data={card} darkMode={darkMode} />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard;