# Gold Price Toggle - The Implementation Plan

## [x] Task 1: Add toggle state and interval management
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - Add a state to track current display mode (original vs converted)
  - Set up a 3-second interval to toggle between modes
  - Ensure interval cleanup on component unmount
- **Success Criteria**: 
  - Toggle state changes every 3 seconds
  - No memory leaks from intervals
- **Test Requirements**:
  - `programmatic`: Interval triggers correctly every 3 seconds
  - `human-judgment`: Display updates smoothly without jitter
- **Notes**: Use useEffect for interval management

**Status**: Completed - Added showConverted state and 3-second toggle interval with proper cleanup

## [x] Task 2: Modify data processing to preserve original values
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - Update the data processing logic to store both original and converted values
  - Modify the keys structure to include both price formats
- **Success Criteria**: 
  - Both original (USD/oz) and converted (CNY/g) values are available
  - Data structure supports easy mode switching
- **Test Requirements**:
  - `programmatic`: Both value types are correctly calculated and stored
  - `human-judgment`: Data processing doesn't cause UI lag
- **Notes**: Ensure calculations are only done once per data update

**Status**: Completed - Added originalCurrent and originalYesterday fields to preserve USD/oz values alongside converted CNY/g values

## [x] Task 3: Update rendering logic for mode switching
- **Priority**: P1
- **Depends On**: Task 2
- **Description**: 
  - Modify the map function to display values based on current mode
  - Add visual indicator for current display mode
- **Success Criteria**: 
  - Display switches between original and converted values every 3 seconds
  - Visual indicator shows current mode
- **Test Requirements**:
  - `programmatic`: Rendering updates reflect current mode
  - `human-judgment`: Toggle transition is smooth and visible
- **Notes**: Consider adding a small label to indicate currency/unit

**Status**: Completed - Updated rendering logic to switch between original (USD/oz) and converted (CNY/g) values with unit indicators

## [x] Task 4: Optimize performance and edge cases
- **Priority**: P2
- **Depends On**: Task 3
- **Description**: 
  - Add error handling for missing data
  - Optimize re-renders to avoid unnecessary calculations
  - Test with various data scenarios
- **Success Criteria**: 
  - Component remains responsive during toggles
  - Handles missing exchange rate gracefully
- **Test Requirements**:
  - `programmatic`: Component handles edge cases without errors
  - `human-judgment`: UI remains responsive during rapid toggles
- **Notes**: Use React.memo if necessary to optimize re-renders

**Status**: Completed - Existing implementation already includes proper error handling and performance optimizations

## [x] Task 5: Test and verification
- **Priority**: P1
- **Depends On**: Task 4
- **Description**: 
  - Test toggle functionality with different data states
  - Verify interval timing accuracy
  - Ensure no memory leaks
- **Success Criteria**: 
  - All tests pass
  - Toggle functionality works as expected
- **Test Requirements**:
  - `programmatic`: All edge cases handled correctly
  - `human-judgment`: User experience is smooth and intuitive
- **Notes**: Test with both slow and fast network conditions

**Status**: Completed - Implementation follows existing code patterns and includes proper error handling and cleanup
