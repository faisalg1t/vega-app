import React, {ReactNode, RefObject, useState} from 'react';
import {TouchableHighlight,
  NativeSyntheticEvent,
  TargetedEvent, ViewProps} from 'react-native';
import type { TouchableHighlightProps } from 'react-native';
import {styles} from './styles';

interface ControlProps extends ViewProps {
  children: ReactNode;
  callback?: () => void;
  controlRef?: any;
  disabled?: boolean;
  style?: any;
  resetControlTimeout?: () => void;
}

export const Control = ({
  children,
  callback,
  controlRef,
  disabled,
  style = {},
  ...props
}: ControlProps) => {
  const [focused, setFocused] = useState(false);

  const setFocusedState = () => setFocused(true);
  const cancelFocusedState = () => setFocused(false);

  const focusedStyle = focused ? {opacity: 1} : {};

  return (
    <TouchableHighlight
      // @ts-ignore
      onFocus={setFocusedState}
      // @ts-ignore
      onBlur={cancelFocusedState}
      disabled={disabled}
      ref={controlRef}
      underlayColor="transparent"
      activeOpacity={1}
      onPress={() => {
        callback && callback();
      }}
      style={[styles.control, style, focused && focusedStyle]}
      {...props}>
      {children}
    </TouchableHighlight>
  );
};
