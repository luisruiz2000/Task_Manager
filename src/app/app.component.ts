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
import { CommonModule } from '@angular/common';
import { Task } from '../app/models/task.model';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'], // Corregido de styleUrl a styleUrls
})
export class AppComponent {
  constructor() {}

  injector = inject(Injector);

  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storage = localStorage.getItem('tasks');
      if (storage) {
        const tasks = JSON.parse(storage);
        this.tasks.set(tasks);
      }
    }
    this.trackTasks();
  }

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

  tasksCompleted: number = 0;

  tasks = signal<Task[]>([]);

  filter = signal<'all' | 'pending' | 'completed'>('all');

  tasksByFilter = computed(() => {
    const filter = this.filter();
    const tasks = this.tasks();

    if (filter === 'all') return tasks;
    if (filter === 'pending') return tasks.filter((t) => !t.completed);
    if (filter === 'completed') return tasks.filter((t) => t.completed);
    return tasks;
  });

  newTaskCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  changeHandle() {
    if (this.newTaskCtrl.valid) {
      const newTask = this.newTaskCtrl.value.trim();
      if (newTask !== '') {
        this.addTask(newTask);
        this.newTaskCtrl.setValue('');
      }
    }
  }

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

  addTask(title: string) {
    const newTask = {
      id: Date.now(),
      title,
      completed: false,
    };

    this.tasks.update((tasks) => [...tasks, newTask]);
  }

  deleteTask(index: number) {
    if (this.tasksCompleted >= 1) {
      this.tasksCompleted--;
    }
    this.tasks.update((tasks) =>
      tasks.filter((task, position) => position !== index)
    );
  }

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

  changeFilter(filter: 'all' | 'pending' | 'completed') {
    this.filter.set(filter);
  }
}
