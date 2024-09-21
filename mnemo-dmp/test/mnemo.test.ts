import { dmpFromByteArray, dmpToByteArray, surveyListFromByteArray, surveyListToByteArray } from '../index';
import { expect } from 'chai';
import { promises as fs } from "fs";

describe('open', () => {

  it('should return expected surveydata', async () => {
    const input_raw = await fs.readFile("test/test.dmp", "utf8");
    const expected_raw = await fs.readFile("test/test.json", "utf8");
    const expected = JSON.parse(expected_raw);
    //hacky type conversion
    expected.forEach((x: any) => {
      x.date = new Date(x.date);
    });
    const result = surveyListFromByteArray(dmpToByteArray(input_raw));
    expect(result).to.deep.equal(expected);
  });

  it('there and back again', async () => {
    const input_raw = await fs.readFile("test/test.dmp", "utf8");
    const surveys = surveyListFromByteArray(dmpToByteArray(input_raw));
    const output_raw = dmpFromByteArray(surveyListToByteArray(surveys));
    expect(input_raw).to.equal(output_raw);
  });
});