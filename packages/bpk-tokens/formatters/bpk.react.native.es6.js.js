/*
 * Backpack - Skyscanner's Design System
 *
 * Copyright 2016-2019 Skyscanner Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import _ from 'lodash';

import sortTokens from './sort-tokens';
import adjustTypography from './adjust-typography';
import { blockComment } from './license-header';
import valueTemplate from './react-native-value-template';

const SEMANTIC_TOKEN_REGEX = /(.*)_(LIGHT|DARK)_(.*)/;

const tokenTemplate = ({ name, value, type }) =>
  `export const ${_.camelCase(name)} = ${valueTemplate(value, type)};`;

export const categoryTemplate = (
  categoryName,
  props,
) => `export const ${_.camelCase(categoryName)} = {
${_.map(props, prop => `${_.camelCase(prop.name)},`).join('\n')}
};`;

const extractSemanticTokens = allTokens =>
  Object.keys(allTokens).reduce((semanticTokens, tokenKey) => {
    const token = allTokens[tokenKey];
    const match = token.name.match(SEMANTIC_TOKEN_REGEX);
    if (match) {
      // E.g. for backgroundLightColor this will be backgroundColor
      const key = `${match[1]}_${match[3]}`;
      const semanticToken = semanticTokens[key] || {
        name: key,
        type: 'semantic',
        value: {},
        category: `semantic${_.capitalize(token.category)}`,
      };
      // This will be light or dark
      const variation = match[2].toLowerCase();
      semanticToken.value[variation] = { ...token };
      semanticTokens[key] = semanticToken; // eslint-disable-line
    }
    return semanticTokens;
  }, {});

const bpkReactNativeEs6Js = (result, platform = 'other') => {
  const baseTokens = result.toJS();
  const semanticTokens = extractSemanticTokens(baseTokens.props);
  const allTokens = {
    ...baseTokens,
    props: { ...baseTokens.props, ...semanticTokens },
  };

  const { props } = sortTokens(allTokens);

  const categories = _(props)
    .map(prop => prop.category)
    .uniq()
    .value();

  const singleTokens = _.map(props, prop =>
    tokenTemplate(adjustTypography(prop, platform)),
  ).join('\n');

  const groupedTokens = categories
    .sort()
    .map(category =>
      categoryTemplate(
        category,
        _(props)
          .filter({ category })
          .value(),
      ),
    )
    .join('\n');

  return [blockComment, singleTokens, groupedTokens].join('\n');
};

export default bpkReactNativeEs6Js;

export const bpkReactNativeEs6JsAndroid = result =>
  bpkReactNativeEs6Js(result, 'androidRn');

export const bpkReactNativeEs6JsIos = result =>
  bpkReactNativeEs6Js(result, 'iosRn');
