import { Component, Inject, OnInit } from '@angular/core';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { flyInOut, visibility, expand } from '../animations/app.animation';

import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { Comment } from '../shared/comment';

import 'rxjs/add/operator/switchMap';


@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  animations: [
     visibility(), expand(), flyInOut()
  ],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
  }
})
export class DishdetailComponent implements OnInit {

  dish: Dish;
  dishcopy = null;
  dishIds: number[];
  feedbackForm: FormGroup;
  comment: Comment;
  prev: number;
  next: number;
  errMess: string;
  visibility = 'shown';

  formErrors = {
    'author': '',
    'rating': '',
    'comment': ''
  };

  validationMessages = {
    'author': {
      'required':      'Author Name is required.',
      'minlength':     'Author Name must be at least 2 characters long.'
    },
    'comment': {
      'required':      'Comment is required.'
    }
  };

  constructor(private dishService: DishService, private route: ActivatedRoute, private location: Location, private fb: FormBuilder, @Inject('BaseURL') private BaseURL) {
    this.createForm();
  }

  ngOnInit() {
    this.dishService.getDishIds()
      .subscribe(dishIds => this.dishIds = dishIds);
    this.route.params
      .switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishService.getDish(+params['id']); })
      .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
        errmess => { this.dish = null; this.errMess = <any>errmess; });
  }

  createForm() {
    this.feedbackForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2)]],
      rating: ['', [Validators.required]],
      comment: ['', [Validators.required]]
    });

    this.feedbackForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set validation messages now
  }

  onSubmit() {
    const comment: Comment = this.feedbackForm.value;
    comment.date = new Date().toISOString();
    this.dish.comments.push(comment);
    this.dishcopy.comments.push(comment);
    this.dishcopy.save()
      .subscribe(dish => { this.dish = dish; console.log(this.dish); });
    this.feedbackForm.reset({
      author: '',
      rating: 5,
      comment: ''
    });
  }

  onValueChanged(data?: any) {
    if (!this.feedbackForm) { return; }
    const form = this.feedbackForm;
    for (const field in this.formErrors) {
      // clear previous error message (if any)
      this.formErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        for (const key in control.errors) {
          this.formErrors[field] += messages[key] + ' ';
        }
      }
    }
  }

  setPrevNext(dishId: number) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }
}
