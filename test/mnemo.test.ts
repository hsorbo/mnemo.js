import { from_string } from '../index';
import { expect } from 'chai';
import { promises as fs } from "fs";
import { Bas } from '../index';


describe('open', () => {
  it('should return expected surveydata', async () => {
    const input_raw = await fs.readFile("test/test.dmp", "utf8");
    const expected_raw = await fs.readFile("test/test.json", "utf8");
    const expected = JSON.parse(expected_raw);
    //Object.setPrototypeOf(expected, Bas[]);
    const result = from_string(input_raw);
    expect(result).to.deep.equal(expected);
  });
});