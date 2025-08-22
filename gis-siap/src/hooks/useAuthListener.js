import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth } from '../actions/authActions';

export const useAuthListener = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
}; 