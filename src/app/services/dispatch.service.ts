
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  DispatchRequest,
  DispatchOptimizationResponse
} from '../models/dispatch.model';

@Injectable({
  providedIn: 'root'
})
export class DispatchService {

  private readonly http = inject(HttpClient);

  optimize(
    request: DispatchRequest
  ): Observable<DispatchOptimizationResponse> {

    return this.http.post<DispatchOptimizationResponse>(
      '/api/dispatch/optimize',
      request
    );
  }
}
