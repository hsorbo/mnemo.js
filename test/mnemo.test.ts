import { from_string, to_string } from '../index';
import { expect } from 'chai';
import { promises as fs } from "fs";

describe('open', () => {
  
  it('should return expected surveydata', async () => {
    const input_raw = await fs.readFile("test/test.dmp", "utf8");
    const expected_raw = await fs.readFile("test/test.json", "utf8");
    const expected = JSON.parse(expected_raw);
    //hacky type conversion
    expected.forEach((x:any) => {
      x.date = new Date(x.date);
    });
    const result = from_string(input_raw);
    expect(result).to.deep.equal(expected);
  });
  
  it('there and back again', async () => {
    const input_raw = await fs.readFile("test/test.dmp", "utf8");
    const output_raw = to_string(from_string(input_raw));
    expect(input_raw).to.equal(output_raw);
  });
});