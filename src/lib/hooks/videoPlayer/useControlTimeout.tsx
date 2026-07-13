import {Dispatch, SetStateAction, useEffect, useState, useCallback} from 'react';

interface ControlTimeoutProps {
  controlTimeout: ReturnType<typeof setTimeout>;
  controlTimeoutDelay: number;
  mounted: boolean;
  showControls: boolean;
  setShowControls: Dispatch<SetStateAction<boolean>>;
  alwaysShowControls: boolean;
}

export const useControlTimeout = ({
  controlTimeout,
  controlTimeoutDelay,
  mounted,
  showControls,
  setShowControls,
  alwaysShowControls,
}: ControlTimeoutProps) => {
  const [_controlTimeout, _setControlTimeout] = useState<boolean>();
  const [_clearTimeout, setClearTimeout] = useState<boolean>();

  const setControlTimeout = useCallback(() => {
    _setControlTimeout((prevState) => !prevState);
  }, []);

  const clearControlTimeout = useCallback(() => {
    setClearTimeout(true);
  }, []);

  const resetControlTimeout = useCallback(() => {
    clearControlTimeout();
  }, [clearControlTimeout]);

  const hideControls = useCallback(() => {
    if (mounted && showControls && !alwaysShowControls) {
      setShowControls(false);
    }
  }, [mounted, showControls, alwaysShowControls, setShowControls]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    controlTimeout = setTimeout(() => {
      hideControls();
    }, controlTimeoutDelay);

    return () => {
      clearTimeout(controlTimeout);
    };
  }, [_controlTimeout]);

  useEffect(() => {
    if (_clearTimeout) {
      clearTimeout(controlTimeout);
      setClearTimeout(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_clearTimeout]);

  return {
    clearControlTimeout,
    resetControlTimeout,
    hideControls,
    setClearTimeout,
    setControlTimeout,
  };
};
