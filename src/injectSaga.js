import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { useStore, ReactReduxContext } from 'react-redux';

import getInjectors from './sagaInjectors';

/**
 * A higher-order component that dynamically injects a saga when the component
 * is instantiated. There are several possible "modes" / "behaviours" that
 * dictate how and when the saga should be injected and ejected
 *
 * @param {Object} params
 * @param {string} params.key The key to inject the saga under
 * @param {function} params.saga The saga that will be injected
 * @param {string} [params.mode] The injection behaviour to use. The default is
 * `SagaInjectionModes.DAEMON` which causes the saga to be started on component
 * instantiation and never canceled or started again. @see
 * {@link SagaInjectionModes} for the other possible modes.
 *
 * @example
 *
 * class BooksManager extends React.PureComponent {
 *  render() {
 *    return null;
 *  }
 * }
 *
 * export default injectSaga({ key: "books", saga: booksSaga })(BooksManager)
 *
 * @public
 *
 */
export default ({ key, saga, mode }) => WrappedComponent => {
  class InjectSaga extends React.Component {
    static WrappedComponent = WrappedComponent;

    static contextType = ReactReduxContext;

    static displayName = `withSaga(${WrappedComponent.displayName ||
      WrappedComponent.name ||
      'Component'})`;

    constructor(props, context) {
      super(props, context);

      this.injectors = getInjectors(context.store);

      this.injectors.injectSaga(key, { saga, mode });
    }

    componentWillUnmount() {
      this.injectors.ejectSaga(key);
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  }

  return hoistNonReactStatics(InjectSaga, WrappedComponent);
};

/**
 * A react hook that dynamically injects a saga when the hook is run
 *
 * @param {Object} params
 * @param {string} params.key The key to inject the saga under
 * @param {function} params.saga The saga that will be injected
 * @param {string} [params.mode] The injection behaviour to use. The default is
 * `SagaInjectionModes.DAEMON` which causes the saga to be started on component
 * instantiation and never canceled or started again. @see
 * {@link SagaInjectionModes} for the other possible modes.
 *
 * @example
 *
 * function BooksManager() {
 *   useInjectSaga({ key: "books", saga: booksSaga })
 *
 *   return null;
 * }
 *
 * @public
 */
const useInjectSaga = ({ key, saga, mode }) => {
  const store = useStore();

  const isInjected = React.useRef(false);

  if (!isInjected.current) {
    getInjectors(store).injectSaga(key, { saga, mode });
    isInjected.current = true;
  }

  React.useEffect(
    () => () => {
      getInjectors(store).ejectSaga(key);
    },
    [],
  );
};

export { useInjectSaga };
