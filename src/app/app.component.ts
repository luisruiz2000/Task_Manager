import {
  Component,
  computed,
  effect,
  Inject,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Task } from '../app/models/task.model';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'], // Corregido de styleUrl a styleUrls
})
export class AppComponent {
  constructor() {}

  injector = inject(Injector);

  tasksCompleted: number = 0;

  tasks = signal<Task[]>([]);

  filter = signal<'all' | 'pending' | 'completed'>('all');

  ngOnInit() {
    // Recupera las tareas del almacenamiento local o inicializa el array 'tasks'.
    if (typeof window !== 'undefined' && window.localStorage) {
      const storage = localStorage.getItem('tasks');
      if (storage) {
        const tasks = JSON.parse(storage);
        this.tasks.set(tasks);
      }
    }
    this.trackTasks();
  }

  // Sincroniza las tareas en el almacenamiento local cada vez que cambian.
  trackTasks() {
    effect(
      () => {
        const tasks = this.tasks();
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('tasks', JSON.stringify(tasks));
        }
      },
      { injector: this.injector }
    );
  }

  /* Se filtran las tareas y si no hay filtros se devuelve todas las tasks del localstorage */
  tasksByFilter = computed(() => {
    const filter = this.filter();
    const tasks = this.tasks();

    if (filter === 'all') return tasks;
    if (filter === 'pending') return tasks.filter((t) => !t.completed);
    if (filter === 'completed') return tasks.filter((t) => t.completed);
    return tasks;
  });

  /* Se crea el FormControl con validaciones para la entrada de datos */
  newTaskCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  /* Valida la entrada y la pasa a addTask si es correcta */
  changeHandle() {
    if (this.newTaskCtrl.valid) {
      const newTask = this.newTaskCtrl.value.trim();
      if (newTask !== '') {
        this.addTask(newTask);
        this.newTaskCtrl.setValue('');
      }
    }
  }

  /* Actualiza el estado de una tarea como completada o pendiente */
  updateTask(index: number) {
    const taskToUpdate = this.tasksByFilter()[index];

    if (taskToUpdate) {
      this.tasks.update((tasks) =>
        tasks.map((task) =>
          task.id === taskToUpdate.id
            ? { ...task, completed: !task.completed }
            : task
        )
      );

      this.tasksCompleted = this.tasks().filter((i) => i.completed).length;
      console.log(this.tasksCompleted);
    }

    this.tasksCompleted = this.tasks().filter((i) => i.completed).length;
    console.log(this.tasksCompleted);
  }

  /* Agrega una nueva tarea a la lista */
  addTask(title: string) {
    const newTask = {
      id: Date.now(),
      title,
      completed: false,
    };

    this.tasks.update((tasks) => [...tasks, newTask]);
  }

  /* Elimina una tarea de la lista */
  deleteTask(index: number) {
    if (this.tasksCompleted >= 1) {
      this.tasksCompleted--;
    }
    this.tasks.update((tasks) =>
      tasks.filter((task, position) => position !== index)
    );
  }

  /* Cambia el modo de edición de una tarea */
  updateTaskEditingMode(task: any, index: number) {
    if (!task.completed) {
      this.tasks.update((tasks) =>
        tasks.map((t) => ({
          ...t,
          editing: !task.completed && this.tasksByFilter()[index]?.id === t.id,
        }))
      );
    }
  }

  /* Actualiza el título de una tarea mientras está en modo de edición */
  updateTaskEditingTitle(index: number, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const taskToUpdate = this.tasksByFilter()[index];

    this.tasks.update((tasks) =>
      tasks.map((task) =>
        task.id === taskToUpdate.id
          ? { ...task, title: value, editing: false }
          : task
      )
    );
  }

  /* Cambia el filtro de visualización de tareas */
  changeFilter(filter: 'all' | 'pending' | 'completed') {
    this.filter.set(filter);
  }
}
