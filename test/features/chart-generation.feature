Feature: Chart a numeric column from a web page table
  As an engineer evaluating datasets on Wikipedia
  I want to turn a table's numeric column into a chart image
  So that I can visualise the data without manual copy-paste

  Scenario: Plotting a record-progression table
    Given a page containing a table with a numeric "Height (m)" column
    When I run the chart pipeline for that page
    Then a PNG image file is produced
    And the chart is titled after the numeric column
    And the chart contains one point per row

  Scenario: A page with no numeric table
    Given a page whose only table has no numeric columns
    When I run the chart pipeline for that page
    Then the pipeline reports that no numeric column was found
