import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AnalyticsService {
  getSummary() {
    const raw = fs.readFileSync(
      path.join(__dirname, '../mocks/data/analytics-summary.json'),
      'utf-8',
    );
    const data = JSON.parse(raw);
    const { _contract: _c, ...payload } = data;
    return payload;
  }
}
